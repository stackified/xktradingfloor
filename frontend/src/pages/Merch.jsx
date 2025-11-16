import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import MerchHero from '../components/merch/MerchHero.jsx';
import ProductFilter from '../components/merch/ProductFilter.jsx';
import ProductGrid from '../components/merch/ProductGrid.jsx';
import CartSidebar from '../components/merch/CartSidebar.jsx';
import { getAllProducts } from '../controllers/productsController.js';

function Merch() {
  const [all, setAll] = React.useState([]);
  const [category, setCategory] = React.useState('All');
  const [sort, setSort] = React.useState('popular');
  const [cartOpen, setCartOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => setAll(await getAllProducts()))();
  }, []);

  const categories = Array.from(new Set(all.map(p => p.category)));

  let filtered = all.filter(p => category==='All' ? true : p.category === category);
  if (sort === 'price-asc') filtered = filtered.slice().sort((a,b)=>a.price-b.price);
  if (sort === 'price-desc') filtered = filtered.slice().sort((a,b)=>b.price-a.price);
  if (sort === 'newest') filtered = filtered.slice().reverse();

  return (
    <div>
      <Helmet>
        <title>Merch | XK Trading Floor</title>
        <meta name="description" content="Official XK Trading Floor merchandise. Wear your confidence. Trade in style." />
      </Helmet>
      <MerchHero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductFilter categories={categories} activeCategory={category} onCategory={setCategory} sort={sort} onSort={setSort} />
        <ProductGrid products={filtered} onOpen={(p)=>navigate(`/merch/${p.id}`)} />
      </div>

      <button onClick={()=>setCartOpen(true)} className="fixed bottom-6 right-6 btn btn-primary rounded-full shadow-lg shadow-blue-500/20">Open Cart</button>
      <CartSidebar open={cartOpen} onClose={()=>setCartOpen(false)} />
    </div>
  );
}

export default Merch;


