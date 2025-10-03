import React from 'react'
import { useState } from 'react'
import { Edit, Sparkles } from 'lucide-react'
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import Markdown from 'react-markdown';
// Set the base URL for axios requests

axios.defaults.baseURL =import.meta.env.VITE_BASE_URL;
const WriteArticle = () => {
  
  const articleLength=[
      {length:800, text:'Short(500-800 words) '},
      {length:1200, text:'Medium(800-1200 words) '},
      {length:1600, text:'long(1200+ words) '},
  ]

  const [selectedLength,setSelectedLength] = useState(articleLength[0])
  const [input,setInput]=useState('')
  const[loading,setLoading]=useState(false)
  const[content,setContent]=useState('') 

  const {getToken}=useAuth();

 const submitHandler = async (e) => {
  e.preventDefault();
  if (!input) {
    toast.error("Please enter an article topic.");
    return;
  }
  try {
    setLoading(true);
    setContent(''); // Clear previous content

    // 1. A more detailed and clear prompt for the AI
    const prompt = `Write a comprehensive, well-structured, and engaging article on the topic: "${input}". The target length is approximately ${selectedLength.length} words. Ensure it includes an introduction, multiple body paragraphs with detailed points, and a concluding summary.`;

    // 2. Set a higher token limit to avoid cutting the AI off
    // A token is ~0.75 words, so we give it plenty of space.
    const maxTokens = Math.round(selectedLength.length * 1.5);

    const { data } = await axios.post('/api/ai/write-article', {
      prompt: prompt,
      length: maxTokens // Send the token limit, not the word count
    }, {
      headers: { Authorization: `Bearer ${await getToken()}` }
    });

    if (data.success) {
      setContent(data.content);
      toast.success("Article generated successfully!");
    } else {
      // Use the specific error from the backend if it exists
      toast.error(data.error || "Failed to generate article.");
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || "An unexpected error occurred.";
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
}
  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4
  text-slate-700'>
     {/* left col */}
     <form  onSubmit={submitHandler} className='w-full max-w-lg p-4 bg-white rounded-1g border
    border-gray-200'>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#4A7AFF]'/>
          <h1 className='text-xl font-semibold'>Article Configuration</h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Article topic</p>

        <input onChange={(e)=>setInput(e.target.value)} value={input} type='text'   className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border
         border-gray-300' placeholder='The future of artificial intelligence is...'/>

         <p className='mt-4 text-sm font-medium'>Article Length</p>

         <div className='mt-3 flex gap-3 flex-wrap sm:max-w-9/11'>
          {articleLength.map((item,index)=>(
              <span onClick={() => setSelectedLength(item)} className={`text-xs px-4 py-1 border rounded-full 
              cursor-pointer ${selectedLength.text === item.text? 'bg-blue-50 text-blue-700':
              'text-gray-500 border-gray-300'}`} key={index}>{item.text}</span>
          ))}
         </div>
         <br />
         <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#226BFF] 
         to-[#65ADFF] text-white px-4 py-2 mt-6 text-sm rounded-1g cursor-pointer'>
          
          {
            // CORRECT: Spaces added and border color defined
          loading?<span className='w-4 h-4 my-1 rounded-full border-2
           border-white border-t-transparent animate-spin'></span>:<Edit className='w-5'/>
          }
          Generate article
         </button>
     </form>
    {/* right col */}
    <div className='w-full max-w-lg p-4 bg-white rounded-1g flex flex-col border border-gray-200
    min-h-96 max-h-[600px]'>
      <div className='flex items-center gap-3'>
        <Edit  className='w-5 h-5 text-[#4A7AFF]' />
        <h1 className='text-lg font-semibold'>Generated Article</h1>
      </div>
          {!content?(
            <div className='flex-1 flex justify-center items-center'>
                <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                  <Edit className='w-9 h-9'/>
                  <p className='text-center'>Enter a topic and click "generate article" to get started</p>
                </div>
            </div>
          ):(
            <div className='mt-3 h-full overflow-y-scroll text-sm text-slate-600'>
              <div className='reset-tw'>
                <Markdown>{content}</Markdown>
              </div>
            </div>
          )}
      
    </div>
    </div>
  )
}

export default WriteArticle
