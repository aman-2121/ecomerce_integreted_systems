import { Category, Product } from '../models';
import sequelize from '../config/database';

async function cleanupCategories() {
    try {
        console.log('--- STARTING CATEGORY CLEANUP ---');
        const categories = await Category.findAll();

        const normalizedMap = new Map<string, Category>();
        const toDelete: Category[] = [];

        for (const cat of categories) {
            const normalized = cat.name.trim()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            if (normalizedMap.has(normalized)) {
                const primary = normalizedMap.get(normalized)!;
                console.log(`Duplicate found: "${cat.name}" (ID ${cat.id}) matches primary "${primary.name}" (ID ${primary.id})`);

                // Reassign products
                const [affected] = await Product.update(
                    { categoryId: primary.id },
                    { where: { categoryId: cat.id } }
                );
                console.log(`Reassigned ${affected} products to ID ${primary.id}`);

                toDelete.push(cat);
            } else {
                // If the name isn't normalized yet, normalize it now
                if (cat.name !== normalized) {
                    console.log(`Normalizing primary: "${cat.name}" -> "${normalized}"`);
                    await cat.update({ name: normalized });
                }
                normalizedMap.set(normalized, cat);
            }
        }

        for (const cat of toDelete) {
            console.log(`Deleting duplicate category: "${cat.name}" (ID ${cat.id})`);
            await cat.destroy();
        }

        console.log('--- CLEANUP COMPLETE ---');
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

// Since target is in src/scripts, we need to export it to be called or run it directly if used with ts-node
cleanupCategories();
