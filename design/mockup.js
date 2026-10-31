// Mockup-only state switcher. Not production code.
// ?s=launcher | snap | app | switch  sets body[data-state]; ?bar=0 hides the state bar (used by index iframes).
const params = new URLSearchParams(location.search)
const body = document.body
body.dataset.state = params.get('s') || 'default'
if (params.get('bar') === '0') body.classList.add('no-bar')

for (const btn of document.querySelectorAll('[data-set-state]')) {
  btn.addEventListener('click', () => {
    const next = btn.dataset.setState
    body.dataset.state = body.dataset.state === next ? 'default' : next
  })
}

const clock = document.querySelectorAll('[data-clock]')
const tick = () => {
  const now = new Date()
  const t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const d = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  clock.forEach((el) => (el.textContent = el.dataset.clock === 'full' ? `${d}  ${t}` : t))
}
tick()
setInterval(tick, 30000)
