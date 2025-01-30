import React from 'react'
import axios from 'axios'

const [posts, setPosts] = useState();

useEffect(() => {
    axios.get('http://localhost:3000/api/profile')
        .then(res => {
            console.log(res)
        })
        .catch(err => {
            console.log(err)
        })
})

function FetchingProfileData() {
  return (
    <div>
        <ul>
            {
                posts.map(post => <li key={post.id}>{post.title}</li>)
            }
        </ul>
      
    </div>
  )
}

export default fetchingProfileData
