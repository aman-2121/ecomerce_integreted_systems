# E-commerce Project Fixes

## Navbar Focus
- Add active state styling to navbar links (home, cart, orders, etc.) based on current route using useLocation.

## Profile Section Dropdown
- Change profile display to show only first name.
- Convert profile section to a dropdown menu containing:
  - User role
  - Profile link
  - Logout option

## Home Page "Create Account" Button
- Hide "Create Account" button for logged-in users.
- Show button only for guest users.

## ProductDetail Related Products
- Add section to display related products from the same category.
- Fetch related products via API call.
- Display them in a grid below the main product details.
