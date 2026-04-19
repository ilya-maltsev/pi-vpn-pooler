const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "comfy",
  "accentHue": 190
}/*EDITMODE-END*/;

const Tweaks = ({ visible, values, onChange, onClose }) => {
  const { Icons } = window;
  if (!visible) return null;
  const hues = [{ h: 190, name: 'cyan' }, { h: 150, name: 'green' }, { h: 270, name: 'violet' }, { h: 320, name: 'pink' }, { h: 60, name: 'amber' }];
  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <h4>Tweaks</h4>
        <button className="btn sm ghost" onClick={onClose} style={{ padding: 2 }}>
          <Icons.Close size={14}/>
        </button>
      </div>
      <div className="tweaks-body">
        <div className="tweak">
          <span className="tweak-label">Theme</span>
          <div className="chip-group">
            {['dark', 'light'].map(t => (
              <button key={t} className={values.theme === t ? 'on' : ''} onClick={() => onChange({ theme: t })}>{t}</button>
            ))}
          </div>
        </div>
        <div className="tweak">
          <span className="tweak-label">Density</span>
          <div className="chip-group">
            {['comfy', 'dense'].map(t => (
              <button key={t} className={values.density === t ? 'on' : ''} onClick={() => onChange({ density: t })}>{t}</button>
            ))}
          </div>
        </div>
        <div className="tweak">
          <span className="tweak-label">Accent</span>
          <div className="hue-picker">
            {hues.map(h => (
              <div key={h.h}
                className={`hue-swatch ${values.accentHue === h.h ? 'on' : ''}`}
                style={{ background: `oklch(0.82 0.13 ${h.h})` }}
                onClick={() => onChange({ accentHue: h.h })}
                title={h.name}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.Tweaks = Tweaks;
window.TWEAK_DEFAULTS = TWEAK_DEFAULTS;
