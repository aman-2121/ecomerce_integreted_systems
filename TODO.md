# TODO: Fix E-commerce Issues

## 1. Fix Category Functionality
- [x] Update Product interface in Products.tsx to include Category?: { name: string; }
- [x] Update categories array in Products.tsx to use product.Category?.name
- [x] Update filter logic in filterProducts to use product.Category?.name === selectedCategory

## 2. Change "View Details" Button Style to Blue
- [x] Update Product interface in ProductCard.tsx to include Category?: { name: string; }
- [x] Change category display in ProductCard.tsx to product.Category?.name
- [x] Change "View Details" button className from gradient to solid blue

## 3. Add Redirect to Cart Page After Add to Cart
- [x] In ProductCard.tsx, after addToCart call, add window.location.href = '/cart';
