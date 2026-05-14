// V2 — Editorial: asymmetric magazine grid
const { useState, useMemo, useEffect } = React;
const R = window.AUBERGINE;
const IK = window.IK;
const PH = window.placeholder;

function SVG({ html, ...rest }) {
  return <span {...rest} dangerouslySetInnerHTML={{__html: html}} />;
}
function Placeholder({ label, w=800, h=600, tone="wine", className="", style={} }) {
  return <span className={className} style={style} dangerouslySetInnerHTML={{__html: PH({label, w, h, tone})}} />;
}

// === NAV ===
function Nav({ cartCount, onCart, onLogin, loggedIn, onBrowse }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-left">
          <a href="#menu" onClick={(e)=>{e.preventDefault();onBrowse();}}>Menu</a>
          <a>Reservations</a>
          <a>Events</a>
          <a>Story</a>
          <a>Press</a>
        </div>
        <a className="brand">
          <span className="m">Aubergine</span>
          <span className="x">No. 12</span>
        </a>
        <div className="nav-right">
          {loggedIn ? (
            <div style={{display:"flex",alignItems:"center",gap:10,marginRight:8}}>
              <div className="avatar" style={{width:34,height:34,fontSize:12}}>{R.customer.initials}</div>
              <div style={{textAlign:"right",lineHeight:1.1}}>
                <div style={{fontSize:12,color:"var(--cream)",fontWeight:700}}>{R.customer.name.split(" ")[0]}</div>
                <div style={{fontSize:10,color:"var(--wine)",letterSpacing:".22em",fontFamily:"ui-monospace,Menlo,monospace"}}>{R.customer.points.toLocaleString()} PTS</div>
              </div>
            </div>
          ) : (
            <button className="iconbtn" onClick={onLogin}><SVG html={IK.user(15)} /></button>
          )}
          <button className="iconbtn" onClick={onCart}>
            <SVG html={IK.bag(15)} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}

// === HERO ===
function Hero({ onReserve, onBrowse }) {
  return (
    <header className="hero">
      <div className="wrap">
        <div className="hero-issue">
          <div className="x">VOL. <b>VII</b> · ISSUE <b>04</b></div>
          <div className="x">AUTUMN — WINTER ’24</div>
          <div className="x">{R.neighborhood.toUpperCase()}</div>
          <div className="x">★ {R.rating} · {R.reviewCount.toLocaleString()} REVIEWS</div>
        </div>
        <div className="hero-grid">
          <div className="hero-l">
            <div className="num-eyebrow" style={{marginBottom:24}}>01 — A HOUSE OF TWELVE</div>
            <h1>The <em>quiet</em><br/>kitchen.</h1>
            <p className="lede">
              Twelve covers a night. A chef who studied in Lyon and a pastry chef who didn’t. Six chapters served slowly, in a low-lit room facing the Brooklyn waterfront.
            </p>
            <div className="by">— BY {R.chef.toUpperCase()}, <b>CHEF</b> · PHOTOGRAPHED BY THE HOUSE</div>
            <div className="hero-actions">
              <button className="btn-wine" onClick={onReserve}>Reserve a table <SVG html={IK.arrow(12)} /></button>
              <button className="btn-line" onClick={onBrowse}>Read the menu</button>
            </div>
          </div>
          <div className="hero-r">
            <div className="hero-img-big"><Placeholder label="cover · the kitchen" w={900} h={1125} tone="wine" /></div>
            <div className="badge-bl">Service no. 12 · 8:30 pm</div>
            <div className="stats">
              <div className="row"><span>Tonight</span><span className="v">{R.hours[R.todayIndex].day} · {R.hours[R.todayIndex].text}</span></div>
              <div className="row"><span>Tasting</span><span className="v accent">$185 / $295</span></div>
              <div className="row"><span>Bar</span><span className="v">Walk-ins · 5pm</span></div>
              <div className="row"><span>Phone</span><span className="v">{R.phone.replace("+1 ","")}</span></div>
            </div>
          </div>
        </div>
        <div className="hero-strip">
          <div className="marquee">
            <span>Cheflogik powered</span>
            <span className="dot"></span>
            <span>Real-time 86 status</span>
            <span className="dot"></span>
            <span>Tenant · aubergine-rh</span>
            <span className="dot"></span>
            <span>Wine cellar · 2,143 sku</span>
          </div>
          <div>↑ scroll</div>
        </div>
      </div>
    </header>
  );
}

// === QUICK TABS ===
function QuickTabs({ active, onChange }) {
  const tabs = [
    { id:"menu",    num:"01",  name:"Menu",         desc:"À la carte · 23 plates" },
    { id:"reserve", num:"02",  name:"Reservations", desc:"Now booking through January" },
    { id:"events",  num:"03",  name:"Events",       desc:"Salon series · Sunday suppers" },
    { id:"status",  num:"04",  name:"Order Status", desc:"Live · members only" },
  ];
  return (
    <div className="wrap">
      <div className="qtabs">
        {tabs.map(t => (
          <button key={t.id} className={"qtab" + (active===t.id?" active":"")} onClick={()=>onChange(t.id)}>
            <span className="num">{t.num}</span>
            <span className="name">{t.name}</span>
            <span className="desc">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// === INFO TILES ===
function InfoTiles() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <h2>The <em>house</em> — at a glance.</h2>
          <div className="meta">SECTION <b>02</b><br/>PRACTICAL · 4 TILES</div>
        </div>
        <div className="info-tiles">
          <div className="info-tile span2">
            <div className="lbl"><span>02.1 · Hours</span><span>This week</span></div>
            <h3>Service runs <em>Tue → Sun</em>.</h3>
            <div className="body">Two seatings nightly. The room turns at 8:30 pm.</div>
            <div className="hrs">
              {R.hours.map((h,i) => (
                <div key={h.day} className={"d" + (i===R.todayIndex?" today":"")}>
                  <span className="day">{h.day}</span>
                  <span className={"v" + (h.text==="Closed"?" closed":"")}>{h.text === "Closed" ? "—" : h.text.replace(" pm","p").replace(" am","a").replace("12:00","12")}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="info-tile">
            <div className="lbl"><span>02.2 · Service</span><span>Three rooms</span></div>
            <h3>At <em>table</em>.</h3>
            <div className="body">Counter, salon, and a private dining room beneath the cellar.</div>
            <div className="chip-row">
              {R.service.map(s => <span key={s} className="chip">{s}</span>)}
            </div>
          </div>
          <div className="info-tile">
            <div className="lbl"><span>02.3 · Houses</span><span>Two locations</span></div>
            <h3>Find <em>us</em>.</h3>
            <div className="branches">
              {R.branches.map(b => (
                <div className="b" key={b.name}>
                  <span className="n">{b.name}<span className="nt">{b.note}</span></span>
                  <span className="d">{b.distance}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="info-tile span2">
            <div className="lbl"><span>02.4 · Settle up</span><span>Payment</span></div>
            <h3>On the <em>house</em>.</h3>
            <div className="body" style={{maxWidth:520}}>All major cards. Apple Pay at the counter. Service is included on tasting menus, never on the wine pairing.</div>
            <div className="chip-row" style={{marginTop:"auto"}}>
              {R.payments.map(p => <span key={p} className="chip">{p}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// === OFFERS ===
function Offers() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <h2>Quiet <em>invitations</em>.</h2>
          <div className="meta">SECTION <b>03</b><br/>OFFERS · 3 ENTRIES</div>
        </div>
        <div className="offers-grid">
          {R.offers.map((o,i) => (
            <article key={o.title} className="offer">
              <div className="num">0{i+1}</div>
              <div className="big">0{i+1}</div>
              <div className="tag">{o.tag}</div>
              <div className="title">{o.title}</div>
              <div className="body">{o.body}</div>
              <span className="chip">{o.chip}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// === TASTING ===
function Tasting() {
  return (
    <section className="section" style={{paddingTop:48}}>
      <div className="wrap">
        <div className="section-head">
          <h2>Three <em>tasting</em> menus.</h2>
          <div className="meta">SECTION <b>04</b><br/>FROM THE KITCHEN</div>
        </div>
        <div className="tasting">
          {R.tastingMenus.map((t,i) => (
            <div key={t.name} className="tcard">
              <div className="roman">{["I","II","III"][i]}</div>
              <h3>{t.name}</h3>
              <div className="row"><span>Per guest</span><b>${t.price}</b></div>
              <div className="row"><span>Pairing</span><span className="v">+${t.pairing.replace("+","")}</span></div>
              <div className="row"><span>Duration</span><span className="v">~ 2h 45m</span></div>
              <button className="btn-line" style={{marginTop:8,width:"100%",justifyContent:"center"}}>Reserve <SVG html={IK.arrow(12)} /></button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// === FEATURED ===
function getPopular() {
  const all = [];
  R.categories.forEach(c => c.items.forEach(i => { if (i.pop) all.push({...i, cat:c.name}); }));
  return all.slice(0,6);
}
function Featured({ onOpenItem, onAdd }) {
  const pop = useMemo(getPopular, []);
  const spans = ["s3","s3","s2","s2","s2","s3"];
  // total: 3+3+2+2+2+3 = 15 ... force 6 spans summing nicely; use a 6-col grid
  // Use 3+3 (row1), 2+2+2 (row2), 3+3 (row3 last item only one — fallback)
  const layout = ["s3","s3","s2","s2","s2","s3"];
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <h2>Featured <em>plates</em> · this week.</h2>
          <div className="meta">SECTION <b>05</b><br/>SIX PLATES · MOST REQUESTED</div>
        </div>
        <div className="feat-grid">
          {pop.map((it,i) => (
            <article key={it.id} className={"fcard " + (layout[i] || "s2")} onClick={()=>onOpenItem(it)}>
              <div className="ph"><Placeholder label={it.name} w={800} h={600} tone="wine" /></div>
              <div className="body">
                <div className="meta"><span className="cat">{it.cat}</span><span>0{i+1} / 06</span></div>
                <div className="name">{it.name}</div>
                <div className="desc">{it.desc}</div>
                <div className="bottom">
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div className="pr">${it.price}</div>
                    <div className="dietary">{(it.tags||[]).map(t => <span key={t} className="diet">{t}</span>)}</div>
                  </div>
                  <button className="add-btn" onClick={(e)=>{e.stopPropagation();onAdd(it);}}>Add <SVG html={IK.plus(10)} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// === MENU BROWSE ===
const DIETS = ["VEG","VEGAN","GF"];
function MenuBrowse({ onOpenItem, onAdd }) {
  const [q, setQ] = useState("");
  const [diet, setDiet] = useState(null);
  const [sort, setSort] = useState("default");
  const [active, setActive] = useState("all");

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
        <div className="section-head">
          <h2>The <em>carte</em> — chapter by chapter.</h2>
          <div className="meta">SECTION <b>06</b><br/>23 PLATES · 6 CHAPTERS</div>
        </div>
        <div className="menu-top">
          <div className="cat-tabs">
            <button className={"cat-tab" + (active==="all"?" active":"")} onClick={()=>setActive("all")}>All</button>
            {R.categories.map(c => (
              <button key={c.id} className={"cat-tab" + (active===c.id?" active":"")} onClick={()=>setActive(c.id)}>{c.name}</button>
            ))}
          </div>
          <div className="menu-tools-r">
            <div className="search">
              <SVG html={IK.search(14)} />
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Find by dish or ingredient" />
            </div>
            {DIETS.map(d => (
              <button key={d} className={"filter" + (diet===d?" active":"")} onClick={()=>setDiet(diet===d?null:d)}>{d}</button>
            ))}
            <select className="sort" value={sort} onChange={e=>setSort(e.target.value)}>
              <option value="default">Sort · chef</option>
              <option value="popular">Sort · popular</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </div>
        </div>

        {R.categories.map(c => {
          if (active !== "all" && active !== c.id) return null;
          const items = sortedItems(c.items);
          if (items.length === 0) return null;
          return (
            <div key={c.id} className="cat-block">
              <div className="cat-head-bar">
                <div className="l">
                  <h3>{c.name}</h3>
                  <span className="sub">{c.subtitle.toUpperCase()}</span>
                </div>
                <span className="ct">{items.length} / {c.items.length} plates</span>
              </div>
              <div className="item-grid">
                {items.map(it => (
                  <div key={it.id} className={"item" + (it.eightySix?" eightysix":"")} onClick={()=>onOpenItem(it)}>
                    <div className="ph"><Placeholder label={it.name} w={300} h={300} tone="wine" /></div>
                    <div className="body">
                      <div className="top">
                        <div className="name">{it.name}{it.pop && <span className="pop">POPULAR</span>}</div>
                        <div className="price">${it.price}</div>
                      </div>
                      <div className="desc">{it.desc}</div>
                      <div className="row">
                        <div className="dietary">{(it.tags||[]).map(t => <span key={t} className="diet">{t}</span>)}</div>
                        {it.eightySix
                          ? <span className="eta">86’d · back {it.eightySix.eta}</span>
                          : <button className="add-btn" onClick={(e)=>{e.stopPropagation();onAdd(it);}}>Add to cart <SVG html={IK.plus(10)} /></button>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// === LOYALTY ===
function Loyalty({ loggedIn, onLogin, onAdd }) {
  if (!loggedIn) {
    return (
      <section className="section">
        <div className="wrap">
          <div className="loyalty" style={{gridTemplateColumns:"1fr",padding:48,textAlign:"center"}}>
            <div style={{padding:48,display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
              <div className="num-eyebrow">SECTION 07 — MEMBERS</div>
              <h2 style={{fontSize:48,margin:0,fontWeight:800,letterSpacing:"-.03em"}}>
                Sign in. <em style={{color:"var(--wine)",fontStyle:"italic",fontWeight:300}}>The salon awaits.</em>
              </h2>
              <div style={{color:"var(--cream-2)",maxWidth:520}}>
                Members earn points on every visit, redeem against the cellar, and unlock the chef's-counter four weeks before public.
              </div>
              <button className="btn-wine" onClick={onLogin}>Sign in <SVG html={IK.arrow(12)} /></button>
            </div>
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
        <div className="section-head">
          <h2>The <em>salon</em>.</h2>
          <div className="meta">SECTION <b>07</b><br/>FOR MEMBERS · {c.tier.toUpperCase()}</div>
        </div>
        <div className="loyalty">
          <div className="loy-l">
            <div className="num-eyebrow">07.1 — BALANCE</div>
            <div className="top">
              <div className="avatar">{c.initials}</div>
              <div>
                <div className="greet">Bonsoir, <em style={{fontStyle:"italic",fontWeight:300,color:"var(--wine)"}}>{c.name.split(" ")[0]}</em>.</div>
                <div className="tier">{c.tier} · since 2022 · {c.lastOrders.length + 17} visits</div>
              </div>
            </div>
            <div className="pts">
              <div className="big">{c.points.toLocaleString()}</div>
              <div className="info">
                <div className="lbl">Points balance</div>
                <div className="next">→ {(c.nextTier.at - c.points).toLocaleString()} to {c.nextTier.name}</div>
              </div>
            </div>
            <div className="progress"><div className="bar" style={{width: pct + "%"}} /></div>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"ui-monospace,Menlo,monospace",fontSize:10,letterSpacing:".22em",color:"var(--muted)"}}>
              <span>{c.tier.toUpperCase()}</span>
              <span>{c.nextTier.name.toUpperCase()}</span>
            </div>
            <div className="fav-row">
              {c.favorites.map(f => (
                <span key={f} className="f"><SVG html={IK.heart(11)} /> {f}</span>
              ))}
            </div>
          </div>
          <div className="loy-r">
            <h4>07.2 — REORDER · the usual</h4>
            <div className="reord">
              {c.lastOrders.map(o => (
                <div key={o.name} className="reord-row">
                  <div>
                    <div className="n">{o.name}</div>
                    <div className="w">— {o.when.toUpperCase()} —</div>
                  </div>
                  <div className="r">
                    <span className="pr">${o.price}</span>
                    <button onClick={()=>onAdd({name:o.name,price:o.price,id:o.name})}>Reorder</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// === FOOTER ===
function Foot() {
  return (
    <footer>
      <div className="wrap">
        <div>
          <div className="wm">Auberg<em>i</em>ne</div>
          <div className="tag">— a house of twelve courses · {R.neighborhood}</div>
        </div>
        <div>
          <h5>Visit</h5>
          <ul>
            <li>{R.address}</li>
            <li>{R.phone}</li>
            <li>Reservations open Tue–Sun</li>
          </ul>
        </div>
        <div>
          <h5>The carte</h5>
          <ul>
            <li>Tasting menus</li>
            <li>À la carte</li>
            <li>Wine pairing</li>
            <li>Private events</li>
          </ul>
        </div>
        <div>
          <h5>House</h5>
          <ul>
            <li>About the chef</li>
            <li>Press</li>
            <li>Salon membership</li>
            <li>Careers</li>
          </ul>
        </div>
        <div className="copyright">
          <span>© Aubergine 2024 · all rights reserved</span>
          <span>cheflogik tenant · aubergine-rh</span>
        </div>
      </div>
    </footer>
  );
}

// === DRAWER ===
function CartDrawer({ open, onClose, cart, onInc, onDec }) {
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  return (
    <>
      <div className={"scrim" + (open?" show":"")} onClick={onClose} />
      <aside className={"drawer" + (open?" show":"")}>
        <div className="head">
          <h3>Your cart</h3>
          <button className="iconbtn" onClick={onClose}><SVG html={IK.close(14)} /></button>
        </div>
        <div className="body">
          {cart.length === 0 ? (
            <div className="empty">
              <div className="big">Nothing yet.</div>
              <div style={{fontFamily:"ui-monospace,Menlo,monospace",fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--muted)"}}>— add a plate from the carte —</div>
            </div>
          ) : (
            cart.map(line => (
              <div key={line.id} className="cart-line">
                <span className="th"><Placeholder label={line.name} w={120} h={120} tone="wine" /></span>
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
            <button className="btn-wine ckbtn">Checkout <SVG html={IK.arrow(12)} /></button>
            <div style={{textAlign:"center",fontFamily:"ui-monospace,Menlo,monospace",fontSize:10,letterSpacing:".22em",color:"var(--muted)",textTransform:"uppercase"}}>
              — checkout flow not yet enabled · display only —
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// === ITEM MODAL ===
function ItemModal({ item, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("Standard");
  const [pair, setPair] = useState(null);
  useEffect(() => { setQty(1); setSize("Standard"); setPair(null); }, [item]);
  if (!item) return null;
  return (
    <div className={"modal show"} onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="card">
        <div className="ph">
          <Placeholder label={item.name} w={800} h={1000} tone="wine" />
          <button className="iconbtn close" onClick={onClose}><SVG html={IK.close(14)} /></button>
        </div>
        <div className="right">
          <div className="num-eyebrow">PLATE · {item.id?.toUpperCase()}</div>
          <h2>{item.name}</h2>
          <div className="price-big">${item.price}</div>
          <div className="desc">{item.desc}</div>
          {item.allergens && (
            <div style={{fontFamily:"ui-monospace,Menlo,monospace",fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--muted)"}}>
              Contains · {item.allergens.join(" · ")}
            </div>
          )}
          <div className="dietary">{(item.tags||[]).map(t => <span key={t} className="diet">{t}</span>)}</div>

          <div className="opt-group">
            <h5>Size</h5>
            {["Half portion","Standard","Sharing for two (+$14)"].map(s => (
              <div key={s} className={"opt-row" + (size===s?" sel":"")} onClick={()=>setSize(s)}>
                <span className="opt-name"><span className="rad" />{s}</span>
                <span className="opt-pr">{s.includes("Half") ? "-$8" : s.includes("Sharing") ? "+$14" : "—"}</span>
              </div>
            ))}
          </div>

          <div className="opt-group">
            <h5>Wine pairing</h5>
            {[
              {n:"None — still water, thank you", p:0},
              {n:"By the glass — sommelier's pick", p:24},
              {n:"Half pour — flight portion", p:14},
            ].map(o => (
              <div key={o.n} className={"opt-row" + (pair===o.n?" sel":"")} onClick={()=>setPair(o.n)}>
                <span className="opt-name"><span className="rad" />{o.n}</span>
                <span className="opt-pr">{o.p ? "+$"+o.p : "—"}</span>
              </div>
            ))}
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:20,borderTop:"1px solid var(--divider)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button className="qbtn" onClick={()=>setQty(Math.max(1,qty-1))}><SVG html={IK.minus(11)} /></button>
              <span style={{minWidth:24,textAlign:"center",fontSize:20,fontWeight:800,color:"var(--cream)"}}>{qty}</span>
              <button className="qbtn" onClick={()=>setQty(qty+1)}><SVG html={IK.plus(11)} /></button>
            </div>
            <button className="btn-wine" onClick={()=>{ for(let i=0;i<qty;i++) onAdd(item); onClose(); }}>
              Add — ${(item.price*qty).toFixed(0)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === LOGIN ===
function LoginModal({ open, onClose, onLogin }) {
  const [step, setStep] = useState(1);
  const [tenant, setTenant] = useState("aubergine-rh");
  useEffect(() => { if (!open) setStep(1); }, [open]);
  return (
    <div className={"modal" + (open?" show":"")} onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="login-card">
        {step === 1 ? (
          <>
            <div className="num-eyebrow" style={{marginBottom:8}}>SIGN IN — STEP 01/02</div>
            <h2>Welcome back.</h2>
            <div className="sub">Sign in for loyalty, reservations, and reorder.</div>
            <label>Email</label>
            <input defaultValue="eleanor@vance.studio" />
            <label>Password</label>
            <input type="password" defaultValue="••••••••••••" />
            <button className="btn-wine" style={{width:"100%",padding:16,justifyContent:"center"}} onClick={()=>setStep(2)}>
              Continue → choose house
            </button>
            <div style={{textAlign:"center",marginTop:18,fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--muted)",fontWeight:700}}>
              or <a style={{color:"var(--wine)"}} href="#">create account</a>
            </div>
          </>
        ) : (
          <>
            <div className="num-eyebrow" style={{marginBottom:8}}>SIGN IN — STEP 02/02</div>
            <h2>Choose a house.</h2>
            <div className="sub">Customer accounts span both Aubergine houses.</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
              {R.branches.map((b,i) => {
                const id = i === 0 ? "aubergine-rh" : "aubergine-tribeca";
                return (
                  <div key={id} className={"tenant" + (tenant===id?" sel":"")} onClick={()=>setTenant(id)}>
                    <div>
                      <div className="n">{b.name}</div>
                      <div className="meta">tenant_id · {id}</div>
                    </div>
                    <SVG html={IK.chev(14)} style={{color:"var(--wine)"}} />
                  </div>
                );
              })}
            </div>
            <button className="btn-wine" style={{width:"100%",padding:16,justifyContent:"center"}} onClick={onLogin}>
              Enter aubergine
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Toast({ msg }) {
  return <div className={"toast" + (msg?" show":"")}><span className="dot" />{msg || "—"}</div>;
}

// === APP ===
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
      <Nav cartCount={cart.reduce((s,i)=>s+i.qty,0)} onCart={()=>setCartOpen(true)} onLogin={()=>setLoginOpen(true)} loggedIn={loggedIn} onBrowse={scrollToMenu} />
      <Hero onReserve={()=>setLoginOpen(true)} onBrowse={scrollToMenu} />
      <QuickTabs active={activeTab} onChange={(id)=>{ setActiveTab(id); if(id==="menu") scrollToMenu(); }} />
      <InfoTiles />
      <Offers />
      <Tasting />
      <Featured onOpenItem={setOpenItem} onAdd={add} />
      <MenuBrowse onOpenItem={setOpenItem} onAdd={add} />
      <Loyalty loggedIn={loggedIn} onLogin={()=>setLoginOpen(true)} onAdd={add} />
      <Foot />
      <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} cart={cart} onInc={inc} onDec={dec} />
      <ItemModal item={openItem} onClose={()=>setOpenItem(null)} onAdd={add} />
      <LoginModal open={loginOpen} onClose={()=>setLoginOpen(false)} onLogin={()=>{ setLoggedIn(true); setLoginOpen(false); setToast("Signed in"); setTimeout(()=>setToast(""),1800); }} />
      <Toast msg={toast} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
