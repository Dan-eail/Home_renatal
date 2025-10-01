import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Property from '../models/Property';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedProperties = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kiraconnect';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding properties...');

    // Find all landlords
    const landlords = await User.find({ role: 'landlord' }).limit(50);
    if (landlords.length === 0) {
      console.error('No landlords found. Please seed users first.');
      process.exit(1);
    }

    const properties = [];
    const types = ['apartment', 'house', 'room', 'studio', 'villa'];
    const cities = ['Addis Ababa', 'Bishoftu', 'Adama', 'Bahir Dar', 'Hawassa'];
    const subcities = ['Bole', 'Kirkos', 'Arada', 'Lideta', 'Yeka', 'Nifas Silk', 'Kolfe'];
    const amenitiesList = ['Wifi', 'Parking', 'Security', 'Water', 'Electricity', 'Furnished', 'Balcony'];

    for (let i = 1; i <= 100; i++) {
      const landlord = landlords[Math.floor(Math.random() * landlords.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      
      // Random images from Picsum
      const images = [
        `https://picsum.photos/seed/prop${i}_1/1200/800`,
        `https://picsum.photos/seed/prop${i}_2/1200/800`,
        `https://picsum.photos/seed/prop${i}_3/1200/800`
      ];

      properties.push({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} in ${city} #${i}`,
        description: `Beautiful ${type} located in a prime area of ${city}. Features modern amenities and comfortable living space. Perfect for families or professionals looking for a cozy home. Close to public transport and local markets.`,
        type: type,
        landlord: landlord._id,
        location: {
          city: city,
          subcity: subcities[Math.floor(Math.random() * subcities.length)],
          kebele: `Kebele ${Math.floor(Math.random() * 20) + 1}`,
          address: `Street ${i * 12}, House #${i + 100}`,
          coordinates: {
            lat: 9.0 + (Math.random() - 0.5) * 0.1,
            lng: 38.7 + (Math.random() - 0.5) * 0.1
          }
        },
        price: Math.floor(Math.random() * 20000) + 5000,
        deposit: Math.floor(Math.random() * 10000) + 2000,
        rooms: Math.floor(Math.random() * 4) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        size: Math.floor(Math.random() * 200) + 40,
        furnished: Math.random() > 0.5,
        amenities: amenitiesList.sort(() => 0.5 - Math.random()).slice(0, 4),
        images: images,
        status: 'approved',
        isAvailable: true,
        isFeatured: Math.random() > 0.8,
        viewCount: Math.floor(Math.random() * 500)
      });
    }

    console.log(`Clearing old properties and inserting ${properties.length} new ones...`);
    await Property.deleteMany({});
    await Property.create(properties);

    console.log('Successfully seeded 100 properties!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding properties:', error);
    process.exit(1);
  }
};

seedProperties();
