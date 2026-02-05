# Changelog

## [1.3] - 04/02/2026
### Adicionado
- **Dashboard Completo:** Implementado novo layout com dois cards principais (Home e Thank You).
- **Mapa Visual:** Auto-detecção de elementos da VSL (Scarcity, Hero, Video, CTAs).
- **Gestão de Checkouts:** Interface para editar links de checkout de cada botão identificado.
- **Ticket Médio:** Cálculo automático com base nas ofertas da página.

### Corrigido
- **Bug #3 (Mapa Visual):** Dashboard agora exibe corretamente a estrutura de ambas as VSLs.
- **Permissões de Storage:** Criada migração `20260204_fix_storage_permissions.sql` para corrigir acesso público ao bucket `site_uploads`.
- **VSL Service:** Corrigido bug onde o fallback de banner sobrescrevia URLs válidas do banco de dados.

## [1.2] - 03/02/2026
### Corrigido
- **Bug #1 (Upload):** Falhas de "Invalid Compact JWS" resolvidas usando cliente público.
- **Bug #2 (Mídias):** Adicionado cache-busting (?t=timestamp) para forçar atualização de vídeos e banners.
- **Admin Dashboard:** Adicionado suporte inicial para VSL Thank You.
