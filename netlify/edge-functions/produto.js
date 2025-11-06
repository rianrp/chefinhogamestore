export default async (request, context) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get('id');
  
  // Se não há ID do produto, retorna a página normal
  if (!productId) {
    return context.next();
  }
  
  try {
    // Carregar dados dos produtos
    const dataResponse = await fetch(`${url.origin}/data.json`);
    const siteData = await dataResponse.json();
    
    // Encontrar o produto
    const product = siteData.products?.find(p => p.id === parseInt(productId));
    
    if (!product) {
      return context.next();
    }
    
    // Buscar o HTML da página produto
    const htmlResponse = await context.next();
    const html = await htmlResponse.text();
    
    // Gerar meta tags dinâmicas
    const productTitle = `${product.name} - Chefinho Gaming Store`;
    const productDescription = product.description || `${product.name} por apenas R$ ${product.rl_price.toFixed(2)}. Compre agora na Chefinho Gaming Store!`;
    const productImage = product.image_url.startsWith('http') ? product.image_url : `${url.origin}/${product.image_url}`;
    const productUrl = `${url.origin}/produto.html?id=${product.id}`;
    const productPrice = product.rl_price.toFixed(2);
    
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