//require('dotenv').config({ path: './.env' });
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
// import mongoose from 'mongoose';
// import { DB_NAME } from './constants';
import connectDB from './db/index.js';


connectDB();




/*
import express from 'express';
const app = express();

(async () => {
    try {
        await mongoose.connect('${process.env.MONGODB_URI}/${DB_NAME}');
        console.log('Database connected');

        application.on('error',(error) => {
            console.log("ERRR: ", error);
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
})();
*/