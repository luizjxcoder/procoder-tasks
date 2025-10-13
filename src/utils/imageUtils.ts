/**
 * Comprime uma imagem usando Canvas
 * @param file - Arquivo de imagem
 * @param maxWidth - Largura máxima (default: 1200)
 * @param maxHeight - Altura máxima (default: 900)
 * @param quality - Qualidade da compressão (0-1, default: 0.85)
 * @returns Promise<Blob> - Imagem comprimida
 */
export function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 900,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = () => {
      // Calcular novas dimensões mantendo aspect ratio
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Converter para blob com compressão
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Upload de imagem para o Supabase Storage com compressão
 * @param file - Arquivo de imagem
 * @param bucket - Nome do bucket
 * @param path - Caminho do arquivo
 * @param supabase - Cliente Supabase
 * @returns Promise<string | null> - URL pública da imagem ou null se erro
 */
export async function uploadCompressedImage(
  file: File,
  bucket: string,
  path: string,
  supabase: any
): Promise<string | null> {
  try {
    // Verificar tamanho do arquivo (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Máximo 10MB permitido.')
    }

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem (PNG, JPG, GIF, WebP)')
    }

    console.log('Iniciando compressão da imagem:', file.name, 'Tamanho original:', Math.round(file.size / 1024), 'KB')

    // Comprimir imagem
    const compressedBlob = await compressImage(file, 1200, 900, 0.85)
    
    console.log('Imagem comprimida. Novo tamanho:', Math.round(compressedBlob.size / 1024), 'KB')

    console.log('Iniciando upload para o bucket:', bucket)

    // Upload para Supabase
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      throw new Error(`Falha no upload: ${uploadError.message}`)
    }

    console.log('Upload realizado com sucesso:', path)

    // Obter URL pública
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    if (!data.publicUrl) {
      throw new Error('Falha ao gerar URL pública da imagem')
    }

    console.log('URL pública gerada:', data.publicUrl)
    return data.publicUrl
  } catch (error) {
    console.error('Erro detalhado no upload da imagem:', error)
    throw error
  }
}