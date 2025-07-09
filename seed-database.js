const db = require('./config/connection');
const collection = require('./config/collections');
const bcrypt = require('bcrypt');

// Test data for seeding the database
const testData = {
    users: [
        {
            fullname: "Admin User",
            email: "admin@example.com",
            password: "admin123",
            role: "admin"
        },
        {
            fullname: "Test User",
            email: "test@example.com",
            password: "test123",
            role: "user"
        },
        {
            fullname: "John Smith",
            email: "john@example.com",
            password: "password123",
            role: "user"
        },
        {
            fullname: "Sarah Johnson",
            email: "sarah@example.com",
            password: "password123",
            role: "user"
        },
        {
            fullname: "Mike Wilson",
            email: "mike@example.com",
            password: "password123",
            role: "user"
        }
    ],
    products: [
        {
            Name: "iPhone 15 Pro",
            Price: 999.99,
            Category: "Electronics",
            Description: "Latest iPhone with A17 Pro chip, titanium design, and advanced camera system. Features 6.1-inch Super Retina XDR display."
        },
        {
            Name: "MacBook Air M3",
            Price: 1299.99,
            Category: "Electronics",
            Description: "Ultra-thin laptop with M3 chip, 13.6-inch Liquid Retina display, and all-day battery life. Perfect for work and creativity."
        },
        {
            Name: "AirPods Pro (3rd Gen)",
            Price: 249.99,
            Category: "Electronics",
            Description: "Premium wireless earbuds with active noise cancellation, spatial audio, and adaptive transparency."
        },
        {
            Name: "Samsung 65\" 4K TV",
            Price: 899.99,
            Category: "Electronics",
            Description: "4K Ultra HD Smart TV with HDR, built-in streaming apps, and voice control. Crystal clear picture quality."
        },
        {
            Name: "Nike Air Max 270",
            Price: 129.99,
            Category: "Sports",
            Description: "Comfortable running shoes with Max Air cushioning, breathable mesh upper, and modern design."
        },
        {
            Name: "Adidas Ultraboost 23",
            Price: 189.99,
            Category: "Sports",
            Description: "Premium running shoes with Boost midsole technology, Primeknit upper, and Continental rubber outsole."
        },
        {
            Name: "Yoga Mat Premium",
            Price: 45.99,
            Category: "Sports",
            Description: "Non-slip yoga mat with 6mm thickness, eco-friendly material, and carrying strap included."
        },
        {
            Name: "Coffee Machine Deluxe",
            Price: 299.99,
            Category: "Home & Kitchen",
            Description: "Automatic espresso machine with milk frother, programmable settings, and stainless steel design."
        },
        {
            Name: "Blender Pro 3000",
            Price: 199.99,
            Category: "Home & Kitchen",
            Description: "High-performance blender with 1400W motor, multiple speed settings, and BPA-free pitcher."
        },
        {
            Name: "Air Fryer 5.5L",
            Price: 129.99,
            Category: "Home & Kitchen",
            Description: "Large capacity air fryer with digital touchscreen, 8 preset cooking programs, and dishwasher-safe basket."
        },
        {
            Name: "Gaming Headset RGB",
            Price: 89.99,
            Category: "Gaming",
            Description: "Professional gaming headset with 7.1 surround sound, RGB lighting, and noise-canceling microphone."
        },
        {
            Name: "Mechanical Keyboard",
            Price: 159.99,
            Category: "Gaming",
            Description: "RGB mechanical gaming keyboard with Cherry MX switches, customizable backlighting, and macro keys."
        },
        {
            Name: "Gaming Mouse Wireless",
            Price: 79.99,
            Category: "Gaming",
            Description: "High-precision wireless gaming mouse with 16000 DPI sensor, programmable buttons, and RGB lighting."
        },
        {
            Name: "Men's Casual Shirt",
            Price: 39.99,
            Category: "Fashion",
            Description: "100% cotton casual shirt in navy blue, comfortable fit, perfect for everyday wear."
        },
        {
            Name: "Women's Summer Dress",
            Price: 59.99,
            Category: "Fashion",
            Description: "Elegant floral summer dress, lightweight fabric, available in multiple sizes and colors."
        },
        {
            Name: "Leather Jacket",
            Price: 199.99,
            Category: "Fashion",
            Description: "Premium genuine leather jacket with classic design, multiple pockets, and comfortable lining."
        },
        {
            Name: "Smartphone Stand",
            Price: 19.99,
            Category: "Accessories",
            Description: "Adjustable phone stand with non-slip base, compatible with all smartphone sizes."
        },
        {
            Name: "Wireless Charger",
            Price: 34.99,
            Category: "Accessories",
            Description: "Fast wireless charging pad with LED indicator, compatible with Qi-enabled devices."
        },
        {
            Name: "Bluetooth Speaker",
            Price: 69.99,
            Category: "Electronics",
            Description: "Portable Bluetooth speaker with 360-degree sound, waterproof design, and 12-hour battery life."
        },
        {
            Name: "Smartwatch Fitness",
            Price: 149.99,
            Category: "Electronics",
            Description: "Advanced fitness smartwatch with heart rate monitor, GPS tracking, and 7-day battery life."
        }
    ]
};

async function clearDatabase() {
    try {
        const dbConnection = db.get();
        if (!dbConnection) {
            throw new Error('Database connection not available');
        }

        console.log('🗑️  Clearing existing data...');
        
        // Clear all collections
        await dbConnection.collection(collection.USER_COLLECTION).deleteMany({});
        await dbConnection.collection(collection.PRODUCT_COLLECTION).deleteMany({});
        await dbConnection.collection(collection.CART_COLLECTION).deleteMany({});
        
        console.log('✅ Database cleared successfully');
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        throw error;
    }
}

async function seedUsers() {
    try {
        const dbConnection = db.get();
        if (!dbConnection) {
            throw new Error('Database connection not available');
        }

        console.log('👥 Seeding users...');
        
        const usersToInsert = [];
        
        for (const user of testData.users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            usersToInsert.push({
                fullname: user.fullname,
                email: user.email,
                password: hashedPassword,
                role: user.role,
                createdAt: new Date()
            });
        }
        
        const result = await dbConnection.collection(collection.USER_COLLECTION).insertMany(usersToInsert);
        console.log(`✅ ${result.insertedCount} users inserted successfully`);
        
        return result;
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        throw error;
    }
}

async function seedProducts() {
    try {
        const dbConnection = db.get();
        if (!dbConnection) {
            throw new Error('Database connection not available');
        }

        console.log('📦 Seeding products...');
        
        const productsToInsert = testData.products.map(product => ({
            ...product,
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        
        const result = await dbConnection.collection(collection.PRODUCT_COLLECTION).insertMany(productsToInsert);
        console.log(`✅ ${result.insertedCount} products inserted successfully`);
        
        return result;
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        throw error;
    }
}

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');
        console.log('📊 Database:', process.env.DATABASE_NAME || 'my-ecommerce');
        console.log('🔗 Connection:', process.env.DATABASE_URI);
        
        // Clear existing data
        await clearDatabase();
        
        // Seed new data
        const userResult = await seedUsers();
        const productResult = await seedProducts();
        
        console.log('\n🎉 Database seeding completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   • Users: ${userResult.insertedCount}`);
        console.log(`   • Products: ${productResult.insertedCount}`);
        console.log(`   • Total: ${userResult.insertedCount + productResult.insertedCount} records`);
        
        console.log('\n🔑 Test Accounts:');
        console.log('   Admin: admin@example.com / admin123');
        console.log('   Test: test@example.com / test123');
        console.log('   User1: john@example.com / password123');
        console.log('   User2: sarah@example.com / password123');
        console.log('   User3: mike@example.com / password123');
        
        return {
            users: userResult.insertedCount,
            products: productResult.insertedCount
        };
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        throw error;
    }
}

module.exports = {
    seedDatabase,
    clearDatabase,
    seedUsers,
    seedProducts,
    testData
};

// If this file is run directly
if (require.main === module) {
    db.connect(async (err) => {
        if (err) {
            console.error('❌ Database connection failed:', err);
            process.exit(1);
        } else {
            console.log('✅ Database connected');
            try {
                await seedDatabase();
                process.exit(0);
            } catch (error) {
                console.error('❌ Seeding failed:', error);
                process.exit(1);
            }
        }
    });
}
