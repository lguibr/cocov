# 🎨 Cocov Badge Engine

The `src/core/badges` directory contains a standalone, zero-dependency SVG generator.

## 📐 Coordinate System
The badges follow the [Shields.io specification](https://shields.io/):
- **Height**: Fixed at `20px`.
- **Font**: Verdana, Geneva, Reference sans-serif.
- **Logo**: 14x14px, centered in the left 20px block.

### Width Calculation
Badges are composed of three parts:
1. **Logo Block**: Fixed 20px (or 0 if no logo).
2. **Label Block**: Width = `char_count * 7px + padding`.
3. **Value Block**: Width = `char_count * 8px + padding`.

*Note: The character width constants (7px and 8px) are approximations optimized for Verdana 110 (11px).*

## 🎨 Color Logic
Colors are determined by `getBadgeColor(percentage)` in `generator.ts`:
- **Bright Green (#4c1)**: ≥ 95%
- **Green (#97ca00)**: ≥ 80%
- **Yellow Green (#a4a61d)**: ≥ 70%
- **Yellow (#dfb317)**: ≥ 60%
- **Orange (#fe7d37)**: ≥ 50%
- **Red (#e05d44)**: < 50%

## 🧩 Supported Types
- **Standard**: Lines, Branches, Functions, Statements.
- **Unified**: A wide badge showing all 4 metrics side-by-side.
- **Diff/Delta**: Shows the change (`+1.5%`, `-0.5%`).
- **Logo**: Just the logo square.
