# Política de Segurança

A integridade dos cálculos colorimétricos e a segurança dos usuários do **ChromaForge** são fundamentais. Como a aplicação é estritamente client-side (sem backend ou transmissão de dados para servidores externos), a integridade do código-fonte e das dependências do ecossistema é prioridade central.

---

## Versões com Suporte Ativo

A tabela abaixo descreve as versões do ChromaForge que recebem atualizações de segurança:

| Versão | Suporte Ativo | Observações |
|---|---|---|
| `1.0.x` | Sim | Versão ativa de desenvolvimento na branch `main`. |
| `< 1.0.0` | Não | Versões preliminares não suportadas. |

---

## Como Relatar uma Vulnerabilidade

Se você identificou uma potencial vulnerabilidade de segurança no código, nas dependências ou no fluxo de empacotamento do ChromaForge, por favor siga este procedimento:

1. **Não abra uma issue pública.** Issues públicas expõem potenciais falhas antes que uma correção esteja disponível.
2. Acesse a funcionalidade de reporte confidencial do repositório no GitHub:
   [**Reportar Vulnerabilidade Privada**](https://github.com/PedroBosa/ChromaForge/security/advisories/new)
3. Forneça o máximo de detalhes possível, incluindo:
   - Descrição detalhada do vetor de ataque ou problema de segurança identificado.
   - Passos passo a passo ou script de prova de conceito (PoC) para reproduzir a questão.
   - Análise de impacto potencial e navegadores/ambientes afetados.

---

## Processo de Resposta

- **Confirmação inicial:** Faremos a confirmação de recebimento do seu relato em até 3 dias úteis.
- **Triagem técnica:** Avaliaremos a gravidade e o escopo da falha em até 7 dias úteis.
- **Correção e publicação:** Uma versão corrigida será preparada e disponibilizada na branch `main` e publicada no GitHub Pages após validação dos testes.
- **Divulgação coordenada:** A vulnerabilidade será divulgada publicamente com os créditos devidos ao pesquisador somente após a publicação do patch de correção.
