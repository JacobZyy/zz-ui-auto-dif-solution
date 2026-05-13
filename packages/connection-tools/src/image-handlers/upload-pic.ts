/**
 * 上传文件方法
 * 参考zant-ui的Upload组件里的方法
 */
export async function uploadPic(file: File) {
  const formData = new FormData()
  const uploadConfig = {
    path: '/zhuanzh/',
    originalFormat: 'png',
    sign: typeof window !== 'undefined'
      ? window.btoa(encodeURIComponent(Date.now())).split('').reverse().join('')
      : '',
  }

  formData.append('multipartFile', file)
  Object.entries(uploadConfig).forEach(([key, value]) => {
    formData.append(key, value)
  })
  console.log('🚀 ~ uploadPic ~ formData:', Array.from(formData.entries()))

  try {
    const response = await fetch('https://innermediaproxy.zhuanspirit.com/media/picture/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    console.log('🚀 ~ uploadPic ~ response:', response)

    const data = await response.json()
    console.log('🚀 ~ uploadPic ~ data:', data)
    if (data.respCode) {
      throw new Error(data.respMsg || '上传失败')
    }
    return data.respData
  }
  catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}
