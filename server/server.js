import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/Cloudinary.js';
import userRouter from './routes/userRoutes.js';


//express app initialization
const app=express();
//cloudinary connection
await connectCloudinary();


//middlewares
app.use(cors());

// Body parser with increased size limits for Vercel
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(clerkMiddleware());
//routes
app.get('/',(req,res) =>{
    res.send('server is live');
})

app.use(requireAuth());//idhr se sare routes protected honge

app.use('/api/ai',aiRouter);
app.use('/api/user',userRouter);



const PORT =process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
})