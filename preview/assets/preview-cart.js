/* Preview-only bag (no Shopify backend). */
(function(){
  var items=[];
  function money(n){return '₹'+n.toLocaleString('en-IN');}
  function render(){
    document.querySelectorAll('[data-cart-count]').forEach(function(el){el.textContent=items.reduce(function(a,b){return a+b.qty},0)});
    var list=document.querySelector('[data-cart-lines]'); if(!list) return;
    list.innerHTML=items.length?items.map(function(it,i){return '<div class="cart-line" data-i="'+i+'"><img src="'+it.img+'" alt=""><div><div class="cart-line__title">'+it.title+'</div><div class="cart-line__meta">'+(it.size||'')+'</div><div class="cart-line__qty"><button data-d="-1">−</button><span>'+it.qty+'</span><button data-d="1">+</button></div><button class="cart-line__remove" data-d="0">Remove</button></div><div>'+money(it.price*it.qty)+'</div></div>'}).join(''):'<p class="cart-empty">Your bag is empty.</p>';
    var sub=document.querySelector('[data-cart-subtotal]'); if(sub) sub.textContent=money(items.reduce(function(a,b){return a+b.price*b.qty},0));
  }
  document.addEventListener('submit',function(e){
    var f=e.target.closest('form[data-preview-cart]'); if(!f) return; e.preventDefault();
    var size=(f.querySelector('input[name=size]:checked')||f.querySelector('input[name=size][type=hidden]')||{}).value||'';
    var ex=items.find(function(x){return x.title===f.dataset.title&&x.size===size});
    if(ex) ex.qty++; else items.push({title:f.dataset.title,price:+f.dataset.price,img:f.dataset.img,size:size,qty:1});
    render(); window.terzeeToast&&window.terzeeToast('Added to bag'); window.terzeeOpenDrawer&&window.terzeeOpenDrawer('cart-drawer');
  });
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-d]'); if(!b) return; var i=+b.closest('.cart-line').dataset.i; var d=+b.dataset.d;
    if(d===0) items.splice(i,1); else { items[i].qty+=d; if(items[i].qty<=0) items.splice(i,1); } render();
  });
  render();
})();