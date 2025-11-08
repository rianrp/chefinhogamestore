export default async (request, context) => {
  const url = new URL(request.url);
  
  // Suporta tanto ?id= quanto ?img= quanto /produto/slug
  let productId = url.searchParams.get('id');
  let productSlug = url.searchParams.get('img');
  
  // Se é uma URL como /produto/nome-do-produto
  const pathMatch = url.pathname.match(/\/produto\/(.+)$/);
  if (pathMatch) {
    productSlug = pathMatch[1].replace('.html', '');
  }
  
  // Se não há identificador do produto, retorna a página normal
  if (!productId && !productSlug) {
    return context.next();
  }
  
  try {
    // Função para criar slug (mesma do JavaScript)
    const createProductSlug = (text) => text.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-')      // Substitui espaços por hífens
      .replace(/-+/g, '-')       // Remove hífens duplos
      .trim();
    
    // Carregar dados dos produtos
    const dataResponse = await fetch(`${url.origin}/data.json`);
    const siteData = await dataResponse.json();
    
    // Encontrar o produto por ID ou slug
    let product;
    if (productId) {
      product = siteData.products?.find(p => p.id === parseInt(productId));
    } else if (productSlug) {
      product = siteData.products?.find(p => {
        const slug = createProductSlug(p.name);
        return slug === productSlug;
      });
    }
    
    if (!product) {
      console.log('Produto não encontrado. ID:', productId, 'Slug:', productSlug);
      return context.next();
    }
    
    console.log('Produto encontrado:', product.name, 'para URL:', url.pathname);
    
    // Buscar o HTML da página produto
    const htmlResponse = await context.next();
    const html = await htmlResponse.text();
    
    // Função para obter a melhor imagem disponível
    const getBestProductImage = (product) => {
      // Se tem image_url e não está vazio, usar ela
      if (product.image_url && product.image_url.trim() !== '') {
        return product.image_url.startsWith('http') ? product.image_url : `${url.origin}${product.image_url.startsWith('/') ? '' : '/'}${product.image_url}`;
      }
      
      // Se não tem imagem mas tem vídeo, usar placeholder específico
      if (product.video_url) {
        const encodedName = encodeURIComponent(product.name);
        return `https://via.placeholder.com/1200x630/8B5CF6/ffffff?text=📹+${encodedName}`;
      }
      
      // Fallback: placeholder genérico
      const encodedName = encodeURIComponent(product.name);
      return `https://via.placeholder.com/1200x630/8B5CF6/ffffff?text=${encodedName}`;
    };

    // Gerar meta tags dinâmicas
    const productTitle = `${product.name} - Chefinho Gaming Store`;
    const productDescription = product.description || `${product.name} por apenas R$ ${product.rl_price.toFixed(2)}. Compre agora na Chefinho Gaming Store!`;
    const productImage = getBestProductImage(product);
    const productUrl = `${url.origin}/produto/${createProductSlug(product.name)}`;
    const productPrice = product.rl_price.toFixed(2);
    const productVideo = product.video_url ? (product.video_url.startsWith('http') ? product.video_url : `${url.origin}${product.video_url.startsWith('/') ? '' : '/'}${product.video_url}`) : null;
    
    console.log('Meta tags geradas:', {
      title: productTitle,
      description: productDescription.substring(0, 100) + '...',
      image: productImage,
      url: productUrl,
      price: productPrice
    });
    
    // Substituir meta tags no HTML
    let modifiedHtml = html
      // Title
      .replace(/<title>.*?<\/title>/, `<title>${productTitle}</title>`)
      
      // Meta description
      .replace(/<meta name="description" content=".*?">/, 
        `<meta name="description" content="${productDescription}">`)
      
      // Open Graph
      .replace(/<meta property="og:url" content=".*?">/, 
        `<meta property="og:url" content="${productUrl}">`)
      .replace(/<meta property="og:title" content=".*?">/, 
        `<meta property="og:title" content="${productTitle}">`)
      .replace(/<meta property="og:description" content=".*?">/, 
        `<meta property="og:description" content="${productDescription}">`)
      .replace(/<meta property="og:image" content=".*?">/, 
        `<meta property="og:image" content="${productImage}">`)
      
      // Twitter
      .replace(/<meta property="twitter:url" content=".*?">/, 
        `<meta property="twitter:url" content="${productUrl}">`)
      .replace(/<meta property="twitter:title" content=".*?">/, 
        `<meta property="twitter:title" content="${productTitle}">`)
      .replace(/<meta property="twitter:description" content=".*?">/, 
        `<meta property="twitter:description" content="${productDescription}">`)
      .replace(/<meta property="twitter:image" content=".*?">/, 
        `<meta property="twitter:image" content="${productImage}">`)
      
      // Product price
      .replace(/<meta property="product:price:amount" content=".*?">/, 
        `<meta property="product:price:amount" content="${productPrice}">`);
    
    // Adicionar meta tags de vídeo se disponível
    if (productVideo) {
      modifiedHtml = modifiedHtml
        .replace('</head>', `
          <meta property="og:video" content="${productVideo}">
          <meta property="og:video:type" content="video/mp4">
          <meta property="og:video:width" content="1280">
          <meta property="og:video:height" content="720">
          <meta property="twitter:player" content="${productVideo}">
          <meta property="twitter:player:width" content="1280">
          <meta property="twitter:player:height" content="720">
        </head>`);
    }
    // Retornar HTML modificado
    return new Response(modifiedHtml, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300' // Cache por 5 minutos
      }
    });
    
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return context.next();
  }
};