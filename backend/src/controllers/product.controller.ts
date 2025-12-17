// backend/src/controllers/product.controller.ts
import { Request, Response } from 'express';
import { Product, Category, OrderItem, Order } from '../models';
import { Op } from 'sequelize';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll({ include: [Category] });

    // Add sales count to each product
    const productsWithSalesCount = await Promise.all(
      products.map(async (product) => {
        try {
          const salesCount = await OrderItem.count({
            where: { productId: product.id }
          });

          return {
            ...product.toJSON(),
            salesCount
          };
        } catch (countError) {
          console.warn(`Error counting sales for product ${product.id}:`, countError);
          return {
            ...product.toJSON(),
            salesCount: 0
          };
        }
      })
    );

    res.json({ products: productsWithSalesCount });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByPk(req.params.id, { include: [Category] });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, category, categoryId, image } = req.body;

    if (!name || !price || stock === undefined) {
      return res.status(400).json({ error: 'Name, price and stock are required' });
    }

    const priceNum = parseFloat(price as string);
    const stockNum = parseInt(stock as string, 10);

    if (isNaN(priceNum) || priceNum <= 0) return res.status(400).json({ error: 'Invalid price' });
    if (isNaN(stockNum) || stockNum < 0) return res.status(400).json({ error: 'Invalid stock' });

    let finalCategoryId: number | undefined;

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
      finalCategoryId = undefined;
    }

    const product = await Product.create({
      name: name.trim(),
      description: description?.trim() || null,
      price: priceNum,
      stock: stockNum,
      image: image?.trim() || null,
      categoryId: finalCategoryId,
    });

    // RETURN PRODUCT
    const result = await Product.findByPk(product.id, { include: [Category] });

    res.status(201).json({
      message: 'Product created successfully',
      product: result,
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

    // RETURN UPDATED PRODUCT
    const updated = await Product.findByPk(id, { include: [Category] });

    res.json({
      message: 'Product updated successfully',
      product: updated,
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