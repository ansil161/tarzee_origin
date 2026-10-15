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
  function addItems(list,opts){
    list.forEach(function(n){
      var ex=items.find(function(x){return x.title===n.title&&x.size===(n.size||'')});
      if(ex) ex.qty+=n.qty||1; else items.push({title:n.title,price:+n.price,img:n.img,size:n.size||'',qty:n.qty||1});
    });
    render(); window.terzeeToast&&window.terzeeToast(list.length>1?'Set added to bag':'Added to bag'); window.terzeeOpenDrawer&&window.terzeeOpenDrawer('cart-drawer');
    return Promise.resolve();
  }
  window.terzeeAddItems=addItems;
  document.addEventListener('submit',function(e){
    var f=e.target.closest('form[data-preview-cart]'); if(!f) return; e.preventDefault();
    var size=(f.querySelector('input[name=size]:checked')||f.querySelector('input[name=size][type=hidden]')||{}).value||'';
    var q=f.querySelector('input[name=quantity]');
    addItems([{title:f.dataset.title,price:+f.dataset.price,img:f.dataset.img,size:size,qty:q?(parseInt(q.value,10)||1):1}]);
  });
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-d]'); if(!b) return; var i=+b.closest('.cart-line').dataset.i; var d=+b.dataset.d;
    if(d===0) items.splice(i,1); else { items[i].qty+=d; if(items[i].qty<=0) items.splice(i,1); } render();
  });
  render();
})();