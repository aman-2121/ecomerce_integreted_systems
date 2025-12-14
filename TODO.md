# Fix Internal Server Error on Checkout

## Problem
- Cart item with non-existent product ID causes 500 error during order creation
- Backend crashes when accessing .price or .stock on null product

## Solution Steps
- [x] Add input validation for productId and quantity in createOrder function
- [x] Wrap Product.findByPk calls in try-catch to handle database errors gracefully
- [x] Ensure proper error responses (400 for invalid input, 500 for server errors)

## Files to Edit
- backend/src/controllers/order.controller.ts
