"use client";

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { studioApi } from '@/lib/studio-api';

export default function ClothToolControl() {
  const [code, setCode] = useState('');
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof studioApi.clothToolSessions>>['sessions']>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = useCallback(async () => {
    try { setSessions((await studioApi.clothToolSessions()).sessions); setError(''); }
    catch (err) { setSessions([]); setError(err instanceof Error ? err.message : 'Não foi possível consultar as conexões.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 15000); return () => clearInterval(timer); }, [refresh]);
  async function approve(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await studioApi.approveClothTool(code);
      setCode(''); setNotice(`${result.label} autorizado. Volte ao aplicativo para continuar.`);
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível autorizar.'); }
    finally { setBusy(false); }
  }
  async function revoke(id?: string) {
    setBusy(true); setNotice('');
    try { await studioApi.revokeClothTool(id); await refresh(); setNotice('Acesso revogado. O aplicativo bloqueará o uso na próxima verificação, em até um minuto.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível revogar.'); }
    finally { setBusy(false); }
  }
  return <section className="glass-panel clothtool-control">
    <span className="section-eyebrow">FERRAMENTAS DA EQUIPE</span>
    <h2>ClothTool Studio K</h2>
    <p>Conecte o aplicativo Windows com sua conta da Central de Controle. O acesso acompanha seus cargos de Staff no Discord.</p>
    <ol><li>Abra a versão integrada do ClothTool no Windows.</li><li>Copie o código exibido na tela de conexão.</li><li>Autorize o código abaixo e volte ao aplicativo.</li></ol>
    <form onSubmit={approve} className="clothtool-pairing">
      <label htmlFor="clothtool-code">Código do aplicativo</label>
      <input id="clothtool-code" value={code} onChange={event => setCode(event.target.value.toUpperCase())}
        placeholder="ABCD-1234" maxLength={9} autoComplete="off" spellCheck={false} required pattern="[A-Fa-f0-9]{4}-?[A-Fa-f0-9]{4}" />
      <p>Autorize somente o código que está aparecendo no seu próprio ClothTool.</p>
      <button className="btn btn-primary" disabled={busy || !/^[A-F0-9]{4}-?[A-F0-9]{4}$/.test(code)}>Autorizar aplicativo</button>
    </form>
    {error && <p className="control-notice error" role="alert">{error}</p>}
    {notice && <p className="control-notice success" role="status">{notice}</p>}
    <h3>Suas conexões</h3>
    <p>As sessões duram até 12 horas. Sair da conta do site também invalida a conexão vinculada.</p>
    {loading ? <p>Consultando conexões…</p> : !sessions.length && !error ? <p>Nenhum aplicativo conectado.</p> : null}
    {sessions.map(session => <article key={session.id} className="clothtool-session">
      <div><strong>{session.label}</strong><small>Expira em {new Date(session.expiresAt).toLocaleString('pt-BR')}</small></div>
      <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void revoke(session.id)}>Revogar acesso</button>
    </article>)}
    <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void revoke()}>Revogar todas as minhas conexões e autorizações pendentes</button>
  </section>;
}
