import sql from '../configs/db.js';

export const getUserCreations = async (req, res) => {
    try{
        const {userId}=req.auth();
        const creations=await sql.query('SELECT * FROM creations WHERE user_id=$1 ORDER BY created_at DESC',[userId]);
        res.json({success:true, creations});

    }catch(error){
        res.json({success:false, error:error.message});
    }
}

export const getPublishedCreations = async (req, res) => {
    try{
        
        const creations=await sql.query('SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC');
        res.json({success:true, creations});

    }catch(error){
        res.json({success:false, error:error.message});
    }
}

export const toggleLikeCreations = async (req, res) => {
    try{
        const {userId}=req.auth();
        const {id} =req.body;

        const [creation] =await sql.query('SELECT * FROM creations WHERE id=$1',[id]);

        if(!creation){
            res.json({success:false, error:"Creation not found"});
        }
        const currentLikes=creation.likes;
        const userIdString=userId.toString();
        let updatedLikes;
        let message;
        //check if userId is already in likes array
        if(currentLikes.includes(userIdString)){
            updatedLikes=currentLikes.filter((like)=>like !== userIdString);
            message="creation unliked";
        }else{//add userId to likes array
            updatedLikes=[...currentLikes, userIdString];
            message="creation liked";
        }
        //update likes array in database
        const formattedArray=`{${updatedLikes.join(',')}}`;
        //updating the likes array in the database
        await sql.query('UPDATE creations SET likes=$1::text[] WHERE id=$2',[formattedArray, id]);
        res.json({success:true, message});


    }catch(error){
        res.json({success:false, error:error.message});
    }
}