// Shared mobile prototype — themes via document.documentElement.dataset.theme
const { useState, useMemo, useEffect } = React;
const R = window.AUBERGINE;
const IK = window.IK;
const PH = window.placeholder;

const TONE_BY_THEME = { maison:"warm", editorial:"wine", cinematic:"ember" };
function getTone(){ return TONE_BY_THEME[document.documentElement.dataset.theme] || "warm"; }

function SVG({ html, ...rest }){ return <span {...rest} dangerouslySetInnerHTML={{__html: html}} />; }
function Placeholder({ label, w=600, h=400, className="", style={} }){
  return <span className={className} style={style} dangerouslySetInnerHTML={{__html: PH({label, w, h, tone: getTone()})}} />;
}

function getPopular(){
  const all = [];
  R.categories.forEach(c => c.items.forEach(i => { if (i.pop) all.push({...i, cat:c.name}); }));
  return all.slice(0,6);
}

// === TOP BAR ===
function TopBar({ count, onCart, loggedIn }){
  return (
    <div className="topbar">
      <div className="brand-wm">Aubergine</div>
      <div className="tb-r">
        {loggedIn ? (
          <>
            <div className="avatar">{R.customer.initials}</div>
          </>
        ) : (
          <button className="iconbtn"><SVG html={IK.user(14)} /></button>
        )}
        <button className="iconbtn" onClick={onCart}>
          <SVG html={IK.bag(14)} />
          {count > 0 && <span className="badge">{count}</span>}
        </button>
      </div>
    </div>
  );
}

// === HERO ===
function Hero({ onMenu }){
  const t = document.documentElement.dataset.theme || "maison";
  const TITLES = {
    maison: <>Auberg<em>i</em>ne</>,
    editorial: <>The <em>quiet</em><br/>kitchen.</>,
    cinematic: <>A long dinner.<br/><em>Twelve courses.</em></>,
  };
  return (
    <section className="hero">
      <div className="eyebrow">{R.cuisine.toUpperCase()}</div>
      <h1>{TITLES[t]}</h1>
      <div className="lede">A twelve-seat counter and a chef-driven tasting menu on the Red Hook waterfront.</div>
      <div className="hero-img"><Placeholder label="hero · dining room at dusk" w={750} h={600} /></div>
      <div className="hero-cta">
        <button className="btn-primary">Reserve <SVG html={IK.arrow(11)} /></button>
        <button className="btn-line" onClick={onMenu}>The menu</button>
      </div>
      <div className="hero-meta">
        <div className="item">
          <div className="lbl">Tonight</div>
          <div className="val"><SVG html={IK.clock(12)} /> {R.hours[R.todayIndex].text}</div>
        </div>
        <div className="item">
          <div className="lbl">Rating</div>
          <div className="val"><SVG html={IK.star(11)} /> {R.rating} · {(R.reviewCount/1000).toFixed(1)}k</div>
        </div>
        <div className="item">
          <div className="lbl">Tasting</div>
          <div className="val">$185 / $295</div>
        </div>
        <div className="item">
          <div className="lbl">Address</div>
          <div className="val"><SVG html={IK.pin(11)} /> 184 Van Brunt</div>
        </div>
      </div>
    </section>
  );
}

// === QUICK CHIPS ===
function QChips({ active, onChange }){
  const tabs = [
    { id:"menu",    name:"Browse Menu" },
    { id:"reserve", name:"Reservations" },
    { id:"events",  name:"Events" },
    { id:"status",  name:"Order Status" },
  ];
  return (
    <div className="qchips">
      {tabs.map(t => (
        <button key={t.id} className={"qchip" + (active===t.id?" active":"")} onClick={()=>onChange(t.id)}>
          {t.name}
        </button>
      ))}
    </div>
  );
}

// === LOYALTY ===
function Loyalty(){
  const c = R.customer;
  const pct = Math.min(100, Math.round(c.points / c.nextTier.at * 100));
  return (
    <div className="loy">
      <div className="head">
        <div className="ava">{c.initials}</div>
        <div>
          <div className="n">Bonsoir, {c.name.split(" ")[0]}.</div>
          <div className="t">{c.tier} member · since '22</div>
        </div>
      </div>
      <div className="pts">
        <div className="b">{c.points.toLocaleString()}</div>
        <div className="lbl">points<br/>balance</div>
      </div>
      <div className="progress"><div className="bar" style={{width:pct+"%"}}/></div>
      <div className="progress-meta">
        <span>{c.tier}</span>
        <span>{(c.nextTier.at - c.points).toLocaleString()} to {c.nextTier.name}</span>
      </div>
    </div>
  );
}

// === FEATURED ===
function Featured({ onAdd }){
  const pop = useMemo(getPopular, []);
  return (
    <>
      <div className="s-head">
        <h3>Featured <em>plates</em></h3>
        <span className="meta">6 · ← swipe</span>
      </div>
      <div className="fscroll">
        {pop.map(it => (
          <article key={it.id} className="fcard">
            <div className="ph"><Placeholder label={it.name} w={440} h={330} /></div>
            <div className="body">
              <div className="cat">— {it.cat} —</div>
              <div className="n">{it.name}</div>
              <div className="row">
                <span className="pr">${it.price}</span>
                <button className="add" onClick={()=>onAdd(it)}><SVG html={IK.plus(11)} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

// === MENU BROWSE ===
function MenuBrowse({ onAdd }){
  const [q, setQ] = useState("");
  const [active, setActive] = useState("all");

  function pass(it){
    if (q && !`${it.name} ${it.desc}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }

  return (
    <>
      <div className="s-head">
        <h3>The <em>carte</em></h3>
        <span className="meta">6 chapters</span>
      </div>
      <div className="search">
        <SVG html={IK.search(14)} />
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search dish or ingredient…" />
      </div>
      <div className="ctabs">
        <button className={"ctab" + (active==="all"?" active":"")} onClick={()=>setActive("all")}>All</button>
        {R.categories.map(c => (
          <button key={c.id} className={"ctab" + (active===c.id?" active":"")} onClick={()=>setActive(c.id)}>{c.name}</button>
        ))}
      </div>
      <div className="menu-list">
        {R.categories.map(c => {
          if (active !== "all" && active !== c.id) return null;
          const items = c.items.filter(pass);
          if (items.length === 0) return null;
          return (
            <div key={c.id} className="cat-block">
              <div className="name">{c.name}</div>
              {items.map(it => (
                <div key={it.id} className={"item-row" + (it.eightySix?" eightysix":"")}>
                  <span className="th"><Placeholder label={it.name} w={160} h={160} /></span>
                  <div className="body">
                    <div className="top">
                      <div className="n">{it.name}{it.pop && <span className="pop">POP</span>}</div>
                      <div className="pr">${it.price}</div>
                    </div>
                    <div className="desc">{it.desc}</div>
                    <div className="row">
                      <div className="dietary">{(it.tags||[]).map(t => <span key={t} className="diet">{t}</span>)}</div>
                      {it.eightySix
                        ? <span className="eta">86’d · back {it.eightySix.eta}</span>
                        : <button className="add-btn" onClick={()=>onAdd(it)}><SVG html={IK.plus(10)} /> Add</button>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

// === FAB ===
function FAB({ count, total, onClick }){
  return (
    <button className={"fab" + (count === 0 ? " hidden" : "")} onClick={onClick}>
      <span className="l">
        <span className="ct">{count}</span>
        <span>View cart</span>
      </span>
      <span style={{fontFeatureSettings:'"tnum"'}}>${total.toFixed(0)} <SVG html={IK.arrow(11)} /></span>
    </button>
  );
}

// === CART SHEET ===
function CartSheet({ open, onClose, cart, onInc, onDec }){
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  return (
    <>
      <div className={"scrim" + (open?" show":"")} onClick={onClose} />
      <aside className={"sheet" + (open?" show":"")}>
        <div className="grab" />
        <div className="head">
          <h3>Your cart</h3>
          <button className="iconbtn" onClick={onClose}><SVG html={IK.close(13)} /></button>
        </div>
        <div className="body">
          {cart.length === 0 ? (
            <div className="empty">
              <div className="big">Empty for now.</div>
              <div style={{fontSize:10,letterSpacing:".22em",textTransform:"uppercase",color:"var(--m-muted)",fontWeight:700}}>
                Add from the carte
              </div>
            </div>
          ) : (
            cart.map(line => (
              <div key={line.id} className="cart-line">
                <span className="th"><Placeholder label={line.name} w={120} h={120} /></span>
                <div>
                  <div className="n">{line.name}</div>
                  <div className="qty">
                    <button className="qbtn" onClick={()=>onDec(line.id)}><SVG html={IK.minus(9)} /></button>
                    <span style={{minWidth:18,textAlign:"center"}}>{line.qty}</span>
                    <button className="qbtn" onClick={()=>onInc(line.id)}><SVG html={IK.plus(9)} /></button>
                  </div>
                </div>
                <div className="pr">${(line.price*line.qty).toFixed(0)}</div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="foot">
            <div className="tot">
              <div className="lbl">Total<br/>incl. service</div>
              <div className="v">${total.toFixed(0)}</div>
            </div>
            <button className="btn-primary" style={{padding:16}}>Checkout <SVG html={IK.arrow(12)} /></button>
            <div style={{textAlign:"center",fontSize:9,letterSpacing:".22em",textTransform:"uppercase",color:"var(--m-muted)",fontWeight:700}}>
              display only · checkout not yet enabled
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function Toast({ msg }){
  return <div className={"toast" + (msg?" show":"")}><span className="dot" />{msg || "—"}</div>;
}

// === APP ===
function App(){
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [tab, setTab] = useState("menu");
  const [toast, setToast] = useState("");

  function add(it){
    setCart(prev => {
      const ex = prev.find(p => p.id === it.id);
      if (ex) return prev.map(p => p.id === it.id ? {...p, qty: p.qty+1} : p);
      return [...prev, { id: it.id, name: it.name, price: it.price, qty: 1 }];
    });
    setToast(`Added · ${it.name}`);
    setTimeout(()=>setToast(""),1500);
  }
  function inc(id){ setCart(c => c.map(p => p.id===id?{...p,qty:p.qty+1}:p)); }
  function dec(id){ setCart(c => c.map(p => p.id===id?{...p,qty:p.qty-1}:p).filter(p=>p.qty>0)); }

  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  const count = cart.reduce((s,i)=>s + i.qty, 0);

  return (
    <div className="mobile">
      <TopBar count={count} onCart={()=>setCartOpen(true)} loggedIn={true} />
      <div className="scroll">
        <Hero onMenu={()=>{ const el=document.querySelector('.search'); el?.scrollIntoView({behavior:"smooth",block:"start"}); }} />
        <QChips active={tab} onChange={setTab} />
        <Loyalty />
        <Featured onAdd={add} />
        <MenuBrowse onAdd={add} />
      </div>
      <FAB count={count} total={total} onClick={()=>setCartOpen(true)} />
      <CartSheet open={cartOpen} onClose={()=>setCartOpen(false)} cart={cart} onInc={inc} onDec={dec} />
      <Toast msg={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
