# Regras do Projeto

<!-- BEGIN:user-rules -->
## Restrição de Git Push
A Inteligência Artificial **NUNCA** deve executar ou propor o comando `git push` (especialmente para a branch `main`) sem antes perguntar e obter a autorização explícita do usuário no chat. Os comandos de `git push` não devem ser embutidos em cadeias de comandos (ex: `git commit -m "..." && git push`) a menos que o usuário já tenha autorizado o push para aquela alteração específica.
<!-- END:user-rules -->
