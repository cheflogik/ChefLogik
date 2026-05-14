// V1 — Maison: centered symmetrical luxury
const { useState, useMemo, useEffect } = React;
const R = window.AUBERGINE;
const IK = window.IK;
const PH = window.placeholder;

// -- helpers -------------------------------------------------
function SVG({ html, ...rest }) {
  return <span {...rest} dangerouslySetInnerHTML={{__html: html}} />;
}
function Placeholder({ label, w=800, h=600, tone="warm", className="", style={} }) {
  return <span className={className} style={style} dangerouslySetInnerHTML={{__html: PH({label, w, h, tone})}} />;
}
function Stars({ value }) {
  return (
    <span style={{display:"inline-flex",gap:2,color:"var(--gold)"}}>
      {[0,1,2,3,4].map(i => <SVG key={i} html={IK.star(11)} style={{opacity: i < Math.round(value) ? 1 : .25}} />)}
    </span>
  );
}
function Orn() {
  return (
    <span className="orn">
      <span className="orn-dot" />
    </span>
  );
}

// -- nav -----------------------------------------------------
function Nav({ cartCount, onCart, onLogin, loggedIn, onBrowse }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-left">
          <a href="#menu" onClick={(e)=>{e.preventDefault();onBrowse();}}>Menu</a>
          <a href="#reserve">Reservations</a>
          <a href="#events">Events</a>
          <a href="#story">Story</a>
        </div>
        <a href="#top" className="nav-brand">
          <div className="mark">Aubergine</div>
          <div className="sub">— Est. 2019 —</div>
        </a>
        <div className="nav-right">
          {loggedIn ? (
            <div style={{display:"flex",alignItems:"center",gap:12,marginRight:8}}>
              <div className="avatar" style={{width:36,height:36,fontSize:13}}>{R.customer.initials}</div>
              <div style={{textAlign:"right",lineHeight:1.1}}>
                <div style={{fontSize:12,color:"var(--cream)",fontWeight:500}}>{R.customer.name.split(" ")[0]}</div>
                <div style={{fontSize:10,color:"var(--gold)",letterSpacing:".22em"}}>{R.customer.points.toLocaleString()} PTS</div>
              </div>
            </div>
          ) : (
            <button className="iconbtn" title="Sign in" onClick={onLogin}>
              <SVG html={IK.user(16)} />
            </button>
          )}
          <button className="iconbtn" title="Cart" onClick={onCart}>
            <SVG html={IK.bag(16)} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}

// -- hero ----------------------------------------------------
function Hero({ onReserve, onBrowse }) {
  return (
    <header className="hero">
      <div className="wrap">
        <div className="eyebrow">
          <span className="orn-dot" />
          {R.cuisine} · {R.neighborhood}
          <span className="orn-dot" />
        </div>
        <h1 className="display">Auberg<span className="ital">i</span>ne</h1>
        <p className="hero-sub">
          A twelve-seat counter and a chef-driven tasting menu on the Red Hook waterfront.
          Two services nightly. Wine pairings drawn from a quiet cellar of two thousand bottles.
        </p>
        <div className="hero-actions">
          <button className="btn-gold" onClick={onReserve}>Reserve a Table</button>
          <button className="btn-ghost" onClick={onBrowse}>View the Menu</button>
        </div>
        <div className="hero-img grain">
          <Placeholder label="hero · dining room at dusk" w={1600} h={680} tone="warm" />
          <div className="hero-img-caption">— Service Twelve · 8:30 pm —</div>
        </div>
        <div className="hero-meta">
          <div className="item">
            <div className="lbl">Rating</div>
            <div className="val"><Stars value={R.rating}/> {R.rating} <span style={{color:"var(--muted)"}}>· {R.reviewCount.toLocaleString()} reviews</span></div>
          </div>
          <div className="item">
            <div className="lbl">Tonight</div>
            <div className="val"><SVG html={IK.clock(13)} /> {R.hours[R.todayIndex].text}</div>
          </div>
          <div className="item">
            <div className="lbl">Address</div>
            <div className="val"><SVG html={IK.pin(13)} /> {R.address.split(",")[0]}</div>
          </div>
          <div className="item">
            <div className="lbl">Reservations</div>
            <div className="val"><SVG html={IK.phone(13)} /> {R.phone}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// -- quick tabs ----------------------------------------------
function QuickTabs({ active, onChange }) {
  const tabs = [
    { id:"menu",    num:"i.",   name:"Browse Menu",  note:"86 items · 6 courses" },
    { id:"reserve", num:"ii.",  name:"Reservations", note:"Tue – Sun · 5:30 pm" },
    { id:"events",  num:"iii.", name:"Events",       note:"Chef's table · Salon" },
    { id:"status",  num:"iv.",  name:"Order Status", note:"Live · members" },
  ];
  return (
    <section className="section" style={{paddingTop:64,paddingBottom:48}}>
      <div className="wrap">
        <div className="qtabs">
          {tabs.map(t => (
            <button key={t.id} className={"qtab" + (active===t.id?" active":"")} onClick={()=>onChange(t.id)}>
              <div className="num">{t.num}</div>
              <div className="name">{t.name}</div>
              <div className="note">{t.note}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// -- info cards ----------------------------------------------
function InfoCards() {
  return (
    <section className="section" style={{paddingTop:24}}>
      <div className="wrap">
        <div className="info-grid">
          <div className="info-card">
            <div className="label">House Hours</div>
            <div className="headline">This Week</div>
            <div style={{marginTop:4}}>
              {R.hours.map((h,i) => (
                <div key={h.day} className={"row" + (i===R.todayIndex?" today":"")}>
                  <span className="day">{h.day}</span>
                  <span>{h.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="info-card">
            <div className="label">Two Houses</div>
            <div className="headline">Find Us</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {R.branches.map(b => (
                <div key={b.name}>
                  <div style={{fontSize:14,color:"var(--cream)",fontWeight:400}}>{b.name}</div>
                  <div style={{fontSize:12,color:"var(--cream-2)",marginTop:2,display:"flex",gap:10}}>
                    <span style={{color:"var(--gold)"}}>{b.distance}</span>
                    <span>·</span>
                    <span>{b.note}</span>
                  </div>
                </div>
              ))}
            </div>
            <button style={{background:"transparent",border:"none",color:"var(--gold)",fontSize:10,letterSpacing:".32em",textTransform:"uppercase",fontWeight:600,padding:0,marginTop:8,textAlign:"left",cursor:"pointer"}}>
              Get Directions →
            </button>
          </div>
          <div className="info-card">
            <div className="label">At Table</div>
            <div className="headline">Service</div>
            <div className="body">Counter seating, private dining for parties of eight to twelve, and a quiet bar of natural wines.</div>
            <div className="chip-row">
              {R.service.map(s => <span key={s} className="chip">{s}</span>)}
            </div>
          </div>
          <div className="info-card">
            <div className="label">Settle Up</div>
            <div className="headline">Payment</div>
            <div className="body">All major cards. Apple Pay at the counter. Service is included on tasting menus.</div>
            <div className="chip-row">
              {R.payments.map(p => <span key={p} className="chip">{p}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -- offers --------------------------------------------------
function Offers() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-header">
          <div className="eyebrow">— Quiet Invitations —</div>
          <h2>This <span className="ital">Season</span></h2>
          <div className="lede">Three quiet reasons to come back this autumn.</div>
        </div>
        <div className="offers">
          {R.offers.map(o => (
            <article key={o.title} className="offer">
              <div className="tag">{o.tag}</div>
              <div className="title">{o.title}</div>
              <div className="body">{o.body}</div>
              <span className="pill"><SVG html={IK.spark(10)} /> {o.chip}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// -- tasting menus -------------------------------------------
function TastingMenus() {
  return (
    <section className="section" style={{paddingTop:48}}>
      <div className="wrap">
        <div className="section-header">
          <div className="eyebrow">— Three Menus —</div>
          <h2>Chef's <span className="ital">Tasting</span></h2>
          <div className="lede">A prelude, a full carte blanche, and a vegetal counterpart. Wine pairings drawn from the cellar.</div>
        </div>
        <div className="tasting">
          {R.tastingMenus.map((t,i) => (
            <div key={t.name} className="tasting-card">
              <div className="num">{["No. I","No. II","No. III"][i]}</div>
              <div className="name">{t.name}</div>
              <div className="price">${t.price}</div>
              <div className="pair">Wine pairing <b>${t.pairing}</b></div>
              <button className="add-btn" style={{marginTop:14}}>Reserve <SVG html={IK.arrow(11)} /></button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -- popular items preview -----------------------------------
function getPopular() {
  const all = [];
  R.categories.forEach(c => c.items.forEach(i => { if (i.pop) all.push({...i, cat:c.name}); }));
  return all.slice(0,6);
}
function FeaturedItems({ onOpenItem, onAdd }) {
  const pop = useMemo(getPopular, []);
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-header">
          <div className="eyebrow">— Six From The Counter —</div>
          <h2>Featured <span className="ital">Plates</span></h2>
          <div className="lede">Most-requested by the room this week.</div>
        </div>
        <div className="feat-grid">
          {pop.map(it => (
            <article key={it.id} className="feat-card" onClick={()=>onOpenItem(it)}>
              <span className="ph"><Placeholder label={it.name} w={600} h={450} tone="warm" /></span>
              <div className="body">
                <div className="top">
                  <div className="name">{it.name}</div>
                  <div className="price">${it.price}</div>
                </div>
                <div className="desc">{it.desc}</div>
                <div className="bottom">
                  <div className="dietary">{(it.tags||[]).map(t => <span key={t} className="diet">{t}</span>)}</div>
                  <button className="add-btn" onClick={(e)=>{e.stopPropagation();onAdd(it);}}>
                    <SVG html={IK.plus(10)} /> Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// -- menu browse ---------------------------------------------
const DIETS = ["VEG","VEGAN","GF"];
function MenuBrowse({ onOpenItem, onAdd }) {
  const [q, setQ] = useState("");
  const [diet, setDiet] = useState(null);
  const [sort, setSort] = useState("default");
  const [active, setActive] = useState(R.categories[0].id);

  function pass(it) {
    if (q && !`${it.name} ${it.desc}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (diet && !(it.tags||[]).includes(diet)) return false;
    return true;
  }
  function sortedItems(items) {
    const arr = items.filter(pass);
    if (sort === "price-asc") return [...arr].sort((a,b)=>a.price-b.price);
    if (sort === "price-desc") return [...arr].sort((a,b)=>b.price-a.price);
    if (sort === "popular") return [...arr].sort((a,b)=>(b.pop?1:0)-(a.pop?1:0));
    return arr;
  }

  return (
    <section className="section" id="menu" data-screen-label="Menu Browse">
      <div className="wrap">
        <div className="section-header">
          <div className="eyebrow">— À la Carte —</div>
          <h2>The <span className="ital">Carte</span></h2>
          <div className="lede">Six chapters. Browse the room as you would the cellar — slowly, and twice.</div>
        </div>
        <div className="browse">
          <aside className="cat-rail">
            <div className="ttl">Chapters</div>
            {R.categories.map(c => {
              const ct = sortedItems(c.items).length;
              return (
                <button
                  key={c.id}
                  className={"cat-btn" + (active===c.id?" active":"")}
                  onClick={()=>{
                    setActive(c.id);
                    document.getElementById("cat-"+c.id)?.scrollIntoView({block:"start"});
                  }}
                >
                  <span>{c.name}</span>
                  <span className="ct">{ct} / {c.items.length}</span>
                </button>
              );
            })}
          </aside>
          <div>
            <div className="menu-tools">
              <div className="search">
                <SVG html={IK.search(15)} />
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by dish or ingredient…" />
              </div>
              <div className="filter-row">
                {DIETS.map(d => (
                  <button key={d} className={"filter" + (diet===d?" active":"")} onClick={()=>setDiet(diet===d?null:d)}>
                    {d}
                  </button>
                ))}
              </div>
              <select className="sort" value={sort} onChange={e=>setSort(e.target.value)}>
                <option value="default">Sort · Chef</option>
                <option value="popular">Sort · Popular</option>
                <option value="price-asc">Price · Low → High</option>
                <option value="price-desc">Price · High → Low</option>
              </select>
            </div>

            {R.categories.map(c => {
              const items = sortedItems(c.items);
              if (items.length === 0) return null;
              return (
                <div key={c.id} id={"cat-"+c.id} className="cat-block">
                  <div className="cat-head">
                    <div>
                      <div className="name">{c.name}</div>
                    </div>
                    <div className="sub">— {c.subtitle} —</div>
                  </div>
                  {items.map(it => (
                    <div
                      key={it.id}
                      className={"item-row" + (it.eightySix?" eightysix":"")}
                      onClick={()=>onOpenItem(it)}
                    >
                      <span className="thumb"><Placeholder label={it.name} w={320} h={320} tone="warm" /></span>
                      <div className="body">
                        <div className="name">
                          {it.name}
                          {it.pop && <span className="pop">· POPULAR</span>}
                        </div>
                        <div className="desc">{it.desc}</div>
                        <div className="meta">
                          <div className="dietary">{(it.tags||[]).map(t => <span key={t} className="diet">{t}</span>)}</div>
                          {it.eightySix && (
                            <span className="eta-tag">86'd · {it.eightySix.reason} · back {it.eightySix.eta}</span>
                          )}
                        </div>
                      </div>
                      <div className="side">
                        <div className="price">${it.price}{it.unit ? <span style={{fontSize:11,color:"var(--muted)",letterSpacing:".18em",marginLeft:6}}>/ {it.unit}</span> : null}</div>
                        {!it.eightySix && (
                          <button className="add-btn" onClick={(e)=>{e.stopPropagation();onAdd(it);}}>
                            <SVG html={IK.plus(10)} /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// -- loyalty -------------------------------------------------
function Loyalty({ loggedIn, onLogin, onAdd }) {
  if (!loggedIn) {
    return (
      <section className="section">
        <div className="wrap">
          <div className="loyalty" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18,textAlign:"center"}}>
            <div className="eyebrow">— Members —</div>
            <h2 style={{fontSize:42,margin:0,fontWeight:200}}>Sign in for <span className="ital">loyalty rewards</span></h2>
            <div style={{color:"var(--cream-2)",maxWidth:480,fontWeight:300}}>
              Members earn points on every visit, redeem against the cellar, and unlock the chef's-counter tasting four weeks before the public.
            </div>
            <button className="btn-gold" onClick={onLogin} style={{marginTop:8}}>Sign In</button>
          </div>
        </div>
      </section>
    );
  }
  const c = R.customer;
  const pct = Math.min(100, Math.round(c.points / c.nextTier.at * 100));
  return (
    <section className="section">
      <div className="wrap">
        <div className="loyalty">
          <div className="loyalty-l">
            <h3>— Members Salon —</h3>
            <div className="name-block">
              <div className="avatar">{c.initials}</div>
              <div>
                <div className="greet">Bonsoir, {c.name.split(" ")[0]}.</div>
                <div className="tier">{c.tier} Member · Since 2022</div>
              </div>
            </div>
            <div className="points-row">
              <div className="big">{c.points.toLocaleString()}</div>
              <div className="lbl">Points<br/>Balance</div>
            </div>
            <div>
              <div className="progress"><div className="bar" style={{width: pct + "%"}} /></div>
              <div className="progress-meta">
                <span>{c.tier}</span>
                <span>{(c.nextTier.at - c.points).toLocaleString()} points to {c.nextTier.name}</span>
              </div>
            </div>
          </div>
          <div className="loyalty-r">
            <h4>— Reorder · The Usual —</h4>
            <div className="reorder">
              {c.lastOrders.map(o => (
                <div key={o.name} className="reorder-row">
                  <div className="l">
                    <div className="n">{o.name}</div>
                    <div className="w">— {o.when} —</div>
                  </div>
                  <div className="r">
                    <div className="pr">${o.price}</div>
                    <button onClick={()=>onAdd({name:o.name,price:o.price,id:o.name})}>Reorder</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:24,paddingTop:24,borderTop:"1px solid var(--divider)"}}>
              <h4>— Your Favorites —</h4>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {c.favorites.map(f => (
                  <span key={f} style={{
                    fontSize:11,letterSpacing:".22em",textTransform:"uppercase",fontWeight:600,
                    padding:"8px 12px",border:"1px solid var(--gold-dim)",color:"var(--gold)",display:"inline-flex",gap:8,alignItems:"center"
                  }}>
                    <SVG html={IK.heart(11)} /> {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// -- footer --------------------------------------------------
function Foot() {
  return (
    <footer>
      <div className="wrap">
        <div className="wm">AUBERGINE</div>
        <div>— A House of Twelve Courses · {R.neighborhood} —</div>
        <div className="copyright">© Aubergine 2024 · Cheflogik tenant #aubergine-rh</div>
      </div>
    </footer>
  );
}

// -- cart drawer ---------------------------------------------
function CartDrawer({ open, onClose, cart, onInc, onDec }) {
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  return (
    <>
      <div className={"scrim" + (open?" show":"")} onClick={onClose} />
      <aside className={"drawer" + (open?" show":"")}>
        <div className="head">
          <h3>— Your Cart —</h3>
          <button className="iconbtn" onClick={onClose}><SVG html={IK.close(14)} /></button>
        </div>
        <div className="body">
          {cart.length === 0 ? (
            <div className="empty">
              <div className="big">Empty for now.</div>
              <div style={{fontSize:11,letterSpacing:".22em",textTransform:"uppercase"}}>Add a plate from the carte.</div>
            </div>
          ) : (
            cart.map(line => (
              <div key={line.id} className="cart-line">
                <span className="th"><Placeholder label={line.name} w={120} h={120} tone="warm" /></span>
                <div>
                  <div className="n">{line.name}</div>
                  <div className="qty">
                    <button className="qbtn" onClick={()=>onDec(line.id)}><SVG html={IK.minus(10)} /></button>
                    <span style={{minWidth:18,textAlign:"center"}}>{line.qty}</span>
                    <button className="qbtn" onClick={()=>onInc(line.id)}><SVG html={IK.plus(10)} /></button>
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
            <button className="btn-gold ckbtn">Checkout <SVG html={IK.arrow(12)} /></button>
            <div style={{textAlign:"center",fontSize:10,letterSpacing:".22em",textTransform:"uppercase",color:"var(--muted)"}}>
              Checkout flow not yet enabled · display only
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// -- item modal ----------------------------------------------
function ItemModal({ item, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("Standard");
  const [pair, setPair] = useState(null);
  useEffect(() => { setQty(1); setSize("Standard"); setPair(null); }, [item]);
  if (!item) return null;
  return (
    <div className={"modal" + (item?" show":"")} onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="card">
        <div className="ph">
          <Placeholder label={item.name} w={800} h={1000} tone="warm" />
          <button className="iconbtn close" onClick={onClose} style={{background:"rgba(0,0,0,.4)"}}><SVG html={IK.close(14)} /></button>
        </div>
        <div className="right">
          <div className="eyebrow">— Plate —</div>
          <h2>{item.name}</h2>
          <div className="price-big">${item.price}</div>
          <div className="desc">{item.desc}</div>
          {item.allergens && (
            <div style={{fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--muted)"}}>
              Contains · {item.allergens.join(" · ")}
            </div>
          )}
          <div className="dietary" style={{marginTop:-4}}>
            {(item.tags||[]).map(t => <span key={t} className="diet">{t}</span>)}
          </div>

          <div className="opt-group">
            <h5>— Size —</h5>
            {["Half portion","Standard","Sharing for two (+$14)"].map(s => (
              <div key={s} className={"opt-row" + (size===s?" sel":"")} onClick={()=>setSize(s)}>
                <span className="opt-name"><span className="rad" />{s}</span>
                <span className="opt-pr">{s.includes("Half") ? "-$8" : s.includes("Sharing") ? "+$14" : "—"}</span>
              </div>
            ))}
          </div>

          <div className="opt-group">
            <h5>— Wine Pairing —</h5>
            {[
              {n:"None — still water, thank you", p:0},
              {n:"By the glass — Sommelier's pick", p:24},
              {n:"Half pour — flight portion", p:14},
            ].map(o => (
              <div key={o.n} className={"opt-row" + (pair===o.n?" sel":"")} onClick={()=>setPair(o.n)}>
                <span className="opt-name"><span className="rad" />{o.n}</span>
                <span className="opt-pr">{o.p ? "+$"+o.p : "—"}</span>
              </div>
            ))}
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,paddingTop:20,borderTop:"1px solid var(--divider)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button className="qbtn" onClick={()=>setQty(Math.max(1,qty-1))}><SVG html={IK.minus(11)} /></button>
              <span style={{minWidth:24,textAlign:"center",fontSize:18,color:"var(--cream)",fontFeatureSettings:'"tnum"'}}>{qty}</span>
              <button className="qbtn" onClick={()=>setQty(qty+1)}><SVG html={IK.plus(11)} /></button>
            </div>
            <button className="btn-gold" onClick={()=>{ for(let i=0;i<qty;i++) onAdd(item); onClose(); }}>
              Add — ${(item.price*qty).toFixed(0)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- login modal ---------------------------------------------
function LoginModal({ open, onClose, onLogin }) {
  const [step, setStep] = useState(1);
  const [tenant, setTenant] = useState("aubergine-rh");
  useEffect(() => { if (!open) setStep(1); }, [open]);
  return (
    <div className={"modal" + (open?" show":"")} onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="login-card">
        {step === 1 ? (
          <>
            <h2>Welcome back</h2>
            <div className="sub">Sign in to view loyalty, reservations, and reorder.</div>
            <label>Email</label>
            <input defaultValue="eleanor@vance.studio" />
            <label>Password</label>
            <input type="password" defaultValue="••••••••••••" />
            <button className="btn-gold" style={{width:"100%",padding:16}} onClick={()=>setStep(2)}>
              Continue — Select Restaurant
            </button>
            <div style={{textAlign:"center",marginTop:18,fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--muted)"}}>
              Or <a style={{color:"var(--gold)"}} href="#">create account</a>
            </div>
          </>
        ) : (
          <>
            <h2>Choose a house</h2>
            <div className="sub">Customer accounts span both Aubergine houses.</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
              {R.branches.map((b,i) => {
                const id = i === 0 ? "aubergine-rh" : "aubergine-tribeca";
                return (
                  <div key={id} className={"tenant" + (tenant===id?" sel":"")} onClick={()=>setTenant(id)}>
                    <div>
                      <div className="n">{b.name}</div>
                      <div className="meta" style={{fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--muted)",marginTop:4}}>tenant_id · {id}</div>
                    </div>
                    <SVG html={IK.chev(14)} style={{color:"var(--gold)"}} />
                  </div>
                );
              })}
            </div>
            <button className="btn-gold" style={{width:"100%",padding:16}} onClick={onLogin}>
              Continue to Aubergine
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// -- toast ---------------------------------------------------
function Toast({ msg }) {
  return <div className={"toast" + (msg?" show":"")}><span className="dot" />{msg || "—"}</div>;
}

// === APP =====================================================
function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState("menu");
  const [toast, setToast] = useState("");

  function add(it) {
    setCart(prev => {
      const ex = prev.find(p => p.id === it.id);
      if (ex) return prev.map(p => p.id === it.id ? {...p, qty: p.qty+1} : p);
      return [...prev, { id: it.id, name: it.name, price: it.price, qty: 1 }];
    });
    setToast(`Added · ${it.name}`);
    setTimeout(() => setToast(""), 1800);
  }
  function inc(id){ setCart(c => c.map(p => p.id===id?{...p,qty:p.qty+1}:p)); }
  function dec(id){ setCart(c => c.map(p => p.id===id?{...p,qty:p.qty-1}:p).filter(p=>p.qty>0)); }
  function scrollToMenu(){ document.getElementById("menu")?.scrollIntoView({behavior:"smooth"}); }

  return (
    <>
      <Nav
        cartCount={cart.reduce((s,i)=>s+i.qty,0)}
        onCart={()=>setCartOpen(true)}
        onLogin={()=>setLoginOpen(true)}
        loggedIn={loggedIn}
        onBrowse={scrollToMenu}
      />
      <Hero onReserve={()=>setLoginOpen(true)} onBrowse={scrollToMenu} />
      <QuickTabs active={activeTab} onChange={(id)=>{
        setActiveTab(id);
        if(id==="menu") scrollToMenu();
      }} />
      <InfoCards />
      <Offers />
      <TastingMenus />
      <FeaturedItems onOpenItem={setOpenItem} onAdd={add} />
      <MenuBrowse onOpenItem={setOpenItem} onAdd={add} />
      <Loyalty loggedIn={loggedIn} onLogin={()=>setLoginOpen(true)} onAdd={add} />
      <Foot />
      <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} cart={cart} onInc={inc} onDec={dec} />
      <ItemModal item={openItem} onClose={()=>setOpenItem(null)} onAdd={add} />
      <LoginModal open={loginOpen} onClose={()=>setLoginOpen(false)} onLogin={()=>{ setLoggedIn(true); setLoginOpen(false); setToast("Welcome — signed in"); setTimeout(()=>setToast(""),1800); }} />
      <Toast msg={toast} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
