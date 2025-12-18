# E-commerce Project Fixes TODO

## Frontend Fixes
- [ ] Navbar Focus & Profile Update: Ensure proper active states for navigation links and update profile dropdown to show only first name with role, profile details, and logout options
- [ ] Hide Create Account for Logged-in Users: Conditionally hide the create account section in Home.tsx for authenticated users
- [ ] Order Detail Related Products: Add a section showing related category products when viewing order details
- [ ] Clear Cart After Payment: Update PaymentSuccess page to clear the cart after successful payment
- [ ] Admin Bulk Actions: Add checkboxes and select all functionality for bulk order management in admin orders page
- [ ] Password Change Validation: Implement validation for password changes matching registration rules
- [ ] Admin Search Filters: Add search functionality to all admin tabs (orders, users, low stock, top products, categories)
- [ ] Admin Logout Redirect: Update admin logout to redirect to home page instead of current behavior
- [ ] Admin Profile Quick Action: Fix quick action link in admin profile view to navigate to user orders

## Backend Fixes
- [ ] Admin Orders Enhancement: Update admin orders page to display product names and customer information instead of just order IDs
- [ ] Currency Standardization: Ensure all prices display in birr format (remove any $ signs)

## Testing
- [ ] Test all navigation and functionality
- [ ] Verify admin features work correctly
- [ ] Ensure no console errors or broken links
