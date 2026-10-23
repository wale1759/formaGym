# FORMA photography assets

## Source and usage

The active photography was generated with the built-in image generation tool for this project. It depicts fictional Nigerian athletes and coaches in a contemporary premium fitness environment. These images are not photographs of actual FORMA staff, customers or premises. Original reference screenshots and earlier image crops are retained for reference.

The generated PNG masters remain in the image tool output library; high-quality JPEG copies are saved under `frontend/public/assets/`. JPEG conversion uses quality 92 and preserves the generated pixel dimensions. `image-manifest.json` records the actual dimensions and file sizes. Most images are 1536 x 1024; some coach portraits use a different high-resolution aspect ratio. These replace the much smaller screenshot crops; they are not marketed as 4K originals.

The active logo and favicon remain separate from the photography and retain their current branding.

## Generation briefs

Shared direction: high-resolution commercial/editorial photography; contemporary Nigerian fitness and wellness; warm directional daylight, charcoal surfaces, restrained brass details, realistic skin and materials, uncluttered composition, no added text, logos, watermark or collage.

| Asset stem (`.jpg`) | Subject / generation brief |
| --- | --- |
| `hero-nigeria` | Nigerian woman with braided hair training with a cable machine in a refined contemporary Lagos studio; athlete on the right; cinematic but realistic lighting |
| `coach-tunde` | Fictional Nigerian male strength coach, short natural hair, dark training shirt, welcoming expression; waist-up portrait in an elegant gym |
| `coach-amara` | Fictional Nigerian female yoga and mobility coach, natural hair in a bun, dark olive training outfit; calm portrait in a warm modern studio |
| `coach-chidi` | Fictional Nigerian male performance coach, shaved head and black training shirt; confident waist-up gym portrait |
| `equipment-treadmill` | Full premium black treadmill, clear three-quarter side view, refined charcoal and oak gym |
| `equipment-cable` | Full dual adjustable cable station with visible pulleys and weight stacks, contemporary gym |
| `equipment-rig` | Black functional rig with pull-up bars and yellow training straps, unobstructed apparatus |
| `product-tee` | One plain black technical training tee laid flat on a warm charcoal surface |
| `product-shoes` | A pair of white/charcoal running shoes, crisp knit mesh and laces, studio product photograph |
| `product-gloves` | A pair of black fingerless training gloves, detailed material, overhead product photograph |
| `product-bottle` | One matte black insulated stainless steel bottle with screw cap, upright studio photograph |
| `product-bag` | One plain black gym duffel with handles and strap, complete bag in frame |
| `product-shorts` | One pair of black training shorts laid flat, waistband and both legs visible |
| `meal-jollof` | Grilled tilapia, Nigerian jollof rice, fresh vegetables and a modest plantain portion in an elegant bowl |
| `meal-smoothie` | Mango and Greek yoghurt smoothie with fresh mango and subtle linen styling |
| `meal-ofada` | Nigerian ofada rice, grilled chicken, greens and a small pepper sauce portion |

## Integration

`photography` and `imageSrc()` in `frontend/src/main.jsx` map existing content keys to the new assets. Shop products have dedicated imagery; the nutrition screen and recipe dialogs use photographed meals. The hero loads with high priority; card images load lazily. CSS cover cropping and larger coach portraits maintain a consistent editorial presentation. Existing workout cards reuse the relevant athlete/coach photographs.

The visual direction and example coach/meal content have been updated. Existing currency, booking timezone, API contracts and checkout behaviour are preserved.

See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for crops, sizing and visual treatment.
