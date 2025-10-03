import OpenAI from "openai";
import { clerkClient } from "@clerk/express";
import sql from '../configs/db.js';
import axios from "axios";
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';



const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export const GenerateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, error: "Free usage limit exceeded. Please upgrade to premium plan." });
    }
///logic to generate article from gemini api
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user",content: prompt,},],
      temperature: 0.7,
      max_tokens: length,
  });
  const content = response.choices[0].message.content;



    //   // database and Clerk logic
    await sql`INSERT INTO creations(user_id,prompt,content,type) 
    values(${userId},${prompt},${content},'blog-title');`;
    
    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      });
    }
    // --- End of your logic ---

    res.json({ success: true, content });

  } catch (error) {
    console.log("AI Generation Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const GenerateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, error: "Free usage limit exceeded. Please upgrade to premium plan." });
    }

  //logic to generate blog title from gemini api
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        
        {
            role: "user",
            content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
  });
  const content = response.choices[0].message.content;

//   // database and Clerk logic
    await sql`INSERT INTO creations(user_id,prompt,content,type) 
    values(${userId},${prompt},${content},'Blogtitle');`;
    
    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      });
    }
    // --- End of your logic ---

    res.json({ success: true, content });

  } catch (error) {
    console.log("AI Generation Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const GenerateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt,publish} = req.body;
    const plan = req.plan;
    
    //this feature is only for premium users
    if (plan !== "premium" ) {
      return res.json({ success: false, error: "This feature only available at Yash's Premium version of Quickai" });
    }

    //logic to fetch image from clipdrop api
    const formdata = new FormData()
    formdata.append('prompt', prompt)

    const{data}=await axios.post('https://clipdrop-api.co/text-to-image/v1',formdata,{
      headers: {'x-api-key': process.env.CLIPDROP_API_KEY},
      responseType: 'arraybuffer',
    })
    const base64Image=`data:image/png;base64,${Buffer.from(data,'binary').toString('base64')}`

    //upload image to cloudinary
    const { secure_url: secureURL } = await cloudinary.uploader.upload(base64Image);


    // database and Clerk logic
  await sql.query(
  'INSERT INTO creations (user_id, prompt, content, type, publish) VALUES ($1, $2, $3, $4, $5)',
  [userId, prompt, secureURL, 'image', publish ?? false]
  );
    
// --- End of your logic ---
    res.json({ success: true, content:secureURL });

  } catch (error) {
    console.log("AI Generation Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image  =req.file;
    const plan = req.plan;
    
    //this feature is only for premium users
    if (plan !== "premium" ) {
      return res.json({ success: false, error: "This feature only available at Yash's Premium version of Quickai" });
    }

    
    //upload image to cloudinary
    const { secure_url } = await cloudinary.uploader.upload(image.path,{
      transformation:  [
        {
        effect:"background_removal",
        background_removal: "remove_the_background"
        }
      ]
    })


    // database and Clerk logic
  await sql.query(
  'INSERT INTO creations (user_id, prompt, content, type) VALUES ($1, $2, $3, $4)',
  [userId, "remove background from image", secure_url, 'image']
  );
    
// --- End of your logic ---
    res.json({ success: true, content:secure_url });

  } catch (error) {
    console.log("AI Generation Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image  =req.file;
    const plan = req.plan;
    
    //this feature is only for premium users
    if (plan !== "premium" ) {
      return res.json({ success: false, error: "This feature only available at Yash's Premium version of Quickai" });
    }

    
    //upload image to cloudinary
    const { public_id } = await cloudinary.uploader.upload(image.path);
    
    const imageUrl=cloudinary.url(public_id, {
      transformation:[{effect: `gen_remove:${object}`}],
      resource_type: 'image'
    })


    // database and Clerk logic
  await sql.query(
      'INSERT INTO creations (user_id, prompt, content, type) VALUES ($1, $2, $3, $4)',
      [userId, "remove background from image", imageUrl, 'image']
    );
    
// --- End of your logic ---
    res.json({ success: true, content:imageUrl });

  } catch (error) {
    console.log("AI Generation Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reviewResume = async (req, res) => {
  try {
    const { userId } = req.auth();
   
    const resume =req.file;
    const plan = req.plan;
    
    //this feature is only for premium users
    if (plan !== "premium" ) {
      return res.json({ success: false, error: "This feature only available at Yash's Premium version of Quickai" });
    }

    
    if(reviewResume.size>5*1024*1024){
      return res.json({success:false,error:"File size too large. Max 5MB allowed."});
    }

    const dataBuffer=fs.readFileSync(resume.path);
    const pdfData=await pdf(dataBuffer);


    const prompt=`review the folloging resume and provide constructive feedback on its strengths,weaknesses and areas of improvement. 
    if any grammatical or spelling mistakes found, correct them as well. make sure the feedback is in bullet points. here is the Resume Content:\n\n${pdfData.text}`

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user",content: prompt,},],
      temperature: 0.7,
      max_tokens: 1500,
  });

  const content = response.choices[0].message.content;
    // database and Clerk logic
  await sql.query(
  'INSERT INTO creations (user_id, prompt, content, type) VALUES ($1, $2, $3, $4)',
  [userId, `Review the uploaded resume.`, content, 'resume-review']
  );
    
// --- End of your logic ---
    res.json({ success: true, content});

  } catch (error) {
    console.log("AI Generation Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};