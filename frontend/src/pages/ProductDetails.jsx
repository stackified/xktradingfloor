import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, getAllProducts } from '../controllers/productsController.js';
import ProductDetailsView from '../components/merch/ProductDetailsView.jsx';
import ImageWithFallback from '../components/shared/ImageWithFallback.jsx';

function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = React.useState(null);
  const [all, setAll] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      setProduct(await getProductById(productId));
      setAll(await getAllProducts());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })();
  }, [productId]);

  if (!product) return <div className="max-w-5xl mx-auto px-4 py-10">Product not found.</div>;

  const related = all.filter(p => p.id !== product.id && p.category === product.category).slice(0,3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>{product ? `${product.title} | XK Trading Floor` : 'Product | XK Trading Floor'}</title>
        <meta name="description" content={product?.description || 'View product details and purchase XK Trading Floor merchandise.'} />
      </Helmet>
      <Link to="/merch" className="text-accent hover:underline">← Back to Shop</Link>
      <div className="mt-4">
        <ProductDetailsView product={product} />
      </div>
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">Related Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {related.map(r => (
            <div key={r.id} className="card cursor-pointer" onClick={()=>navigate(`/merch/${r.id}`)}>
              <div className="h-40 w-full bg-muted overflow-hidden">
                <ImageWithFallback src={r.image} fallback="/assets/placeholder.jpg" alt={r.name} className="h-full w-full object-cover" />
              </div>
              <div className="card-body">
                <div className="text-xs text-blue-300">{r.category}</div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-sm text-gray-300">₹{r.price}</div>
              </div>
            </div>
          ))}
          {related.length === 0 && <div className="text-sm text-gray-400">No related items found.</div>}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;


