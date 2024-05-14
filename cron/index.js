const axios = require('axios')

const BACKEND_URL = process.env.BACKEND_URL
                                 

console.log('BACKNEND_URL', BACKEND_URL)

const getRandomArticle = async () => {
  const response = await axios.get('https://en.wikipedia.org/api/rest_v1/page/random/summary')
  return response.data
}

const main = async () => {
  console.log('start')
  const article = await getRandomArticle()
  const todo = article.content_urls.desktop.page
  console.log(todo)
  const obj = { todo }

  const formData = new FormData();
  formData.append('todo', todo);

  try{ 
    const response = await axios.post(BACKEND_URL, obj, { maxRedirects: 0, validateStatus: () => true })
    console.log('success!')
  } catch (error) {
    console.log('error')
    console.log(error)
  }
  console.log('done')
}

main()