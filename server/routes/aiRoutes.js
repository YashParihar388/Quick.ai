import express from 'express';
import {auth} from "../middlewares/auth.js"
import { GenerateArticle, GenerateBlogTitle, GenerateImage, removeImageBackground, removeImageObject, reviewResume } from '../controllers/aiController.js';
import { upload } from '../configs/multer.js';

const aiRouter = express.Router();

aiRouter.post('/write-article',auth,GenerateArticle);
aiRouter.post('/generate-blog-title',auth,GenerateBlogTitle);
aiRouter.post('/generate-image',auth,GenerateImage);
aiRouter.post('/remove-image-background',upload.single('image'),auth,removeImageBackground);
aiRouter.post('/remove-image-object',upload.single('image'),auth,removeImageObject);
aiRouter.post('/resume-review',upload.single('resume'),auth,reviewResume);

export default aiRouter;

