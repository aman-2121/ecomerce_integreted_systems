// backend/src/controllers/product.controller.ts
import { Request, Response } from 'express';
import { Product, Category } from '../models';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll({ include: [Category] });

    // CONVERT BUFFER TO BASE64 FOR FRONTEND
    const productsWithBase64 = products.map(p => ({
      ...p.toJSON(),
      image: p.image ? p.image.toString('base64') : null
    }));

    res.json({ products: productsWithBase64 });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByPk(req.params.id, { include: [Category] });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const productWithBase64 = {
      ...product.toJSON(),
      image: product.image ? product.image.toString('base64') : null
    };

    res.json({ product: productWithBase64 });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, category, categoryId } = req.body;
    const imageFile = req.file;

    if (!name || !price || stock === undefined) {
      return res.status(400).json({ error: 'Name, price and stock are required' });
    }

    const priceNum = parseFloat(price as string);
    const stockNum = parseInt(stock as string, 10);

    if (isNaN(priceNum) || priceNum <= 0) return res.status(400).json({ error: 'Invalid price' });
    if (isNaN(stockNum) || stockNum < 0) return res.status(400).json({ error: 'Invalid stock' });

    let finalCategoryId: number | null = null;

    try {
      if (categoryId) {
        finalCategoryId = parseInt(categoryId as string, 10);
        const cat = await Category.findByPk(finalCategoryId);
        if (!cat) return res.status(400).json({ error: 'Invalid category ID' });
      } else if (category && typeof category === 'string' && category.trim()) {
        let cat = await Category.findOne({ where: { name: category.trim() } });
        if (!cat) cat = await Category.create({ name: category.trim() });
        finalCategoryId = cat.id;
      }
    } catch (categoryError) {
      console.warn('Categories table not available, creating product without category:', categoryError);
      finalCategoryId = null;
    }

    const product = await Product.create({
      name: name.trim(),
      description: description?.trim() || null,
      price: priceNum,
      stock: stockNum,
      image: imageFile ? imageFile.buffer : null,
      categoryId: finalCategoryId,
    });

    // RETURN WITH BASE64 IMAGE
    const result = await Product.findByPk(product.id, { include: [Category] });
    const resultWithBase64 = {
      ...result.toJSON(),
      image: result.image ? result.image.toString('base64') : null
    };

    res.status(201).json({
      message: 'Product created successfully',
      product: resultWithBase64,
    });
  } catch (error: any) {
    console.error('CREATE PRODUCT ERROR:', error);
    res.status(500).json({
      error: 'Failed to create product',
      details: error.message,
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, categoryId } = req.body;
    const imageFile = req.file;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const updates: any = {};

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim() || null;
    if (price !== undefined) {
      const p = parseFloat(price as string);
      if (isNaN(p) || p <= 0) return res.status(400).json({ error: 'Invalid price' });
      updates.price = p;
    }
    if (stock !== undefined) {
      const s = parseInt(stock as string, 10);
      if (isNaN(s) || s < 0) return res.status(400).json({ error: 'Invalid stock' });
      updates.stock = s;
    }
    if (imageFile) updates.image = imageFile.buffer;

    if (categoryId || category) {
      let finalCategoryId: number | null = null;
      try {
        if (categoryId) {
          finalCategoryId = parseInt(categoryId as string, 10);
          const cat = await Category.findByPk(finalCategoryId);
          if (!cat) return res.status(400).json({ error: 'Invalid category ID' });
        } else if (category && typeof category === 'string' && category.trim()) {
          let cat = await Category.findOne({ where: { name: category.trim() } });
          if (!cat) cat = await Category.create({ name: category.trim() });
          finalCategoryId = cat.id;
        }
        updates.categoryId = finalCategoryId;
      } catch (categoryError) {
        console.warn('Categories table not available, skipping category update:', categoryError);
      }
    }

    await product.update(updates);

    // RETURN UPDATED PRODUCT WITH BASE64 IMAGE
    const updated = await Product.findByPk(id, { include: [Category] });
    const updatedWithBase64 = {
      ...updated.toJSON(),
      image: updated.image ? updated.image.toString('base64') : null
    };

    res.json({
      message: 'Product updated successfully',
      product: updatedWithBase64,
    });
  } catch (error: any) {
    console.error('UPDATE PRODUCT ERROR:', error);
    res.status(500).json({
      error: 'Failed to update product',
      details: error.message,
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};