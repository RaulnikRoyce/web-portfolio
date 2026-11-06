# Portfólio de Raulnik Royce

Página pessoal para apresentar projetos, experiência em design e trajetória em desenvolvimento full stack.

[Site publicado](https://portfolio.raulnikroyce.dev/) · [GitHub](https://github.com/RaulnikRoyce)

## Conteúdo

A página apresenta life.and.roads, Beco Underground (painel, loja e API) e Jungle Backend Challenge, desenvolvido para um processo seletivo. Depois dos cards, apresenta um estudo de caso anônimo da Fase 0 de uma loja de skins Dota 2, seguido de tecnologias, perfil, trajetória e contato. Os vídeos são demonstrações e podem mostrar versões anteriores dos produtos.

O life.and.roads está em beta aberto 1.5.3, com links para o app web e o APK Android mais recente. O currículo em PDF pode ser baixado no início da página e na seção de contato.

O Jungle processa transações de apostas com NestJS, PostgreSQL e SQS via LocalStack. O card apresenta a execução local com Docker, os 67 testes aprovados na verificação da entrega e os links do repositório e das decisões técnicas.

O estudo de caso Dota 2 descreve provas de integração, testes e relatório de viabilidade entregues ao cliente. A construção da loja aguarda ativação. O número de 709 testes se refere à verificação documentada da entrega. O resumo público omite identificação do cliente, valores, conversas e documentos privados.

## Implementação

HTML5, CSS e JavaScript, sem dependências de execução ou etapa de build.

- `index.html` contém a apresentação e os metadados de compartilhamento.
- `404.html` usa caminhos absolutos para carregar os recursos mesmo em rotas aninhadas.
- `assets/css/` separa tokens visuais, base, layout e componentes.
- `assets/js/main.js` controla o menu mobile e a iluminação do fundo. Escape fecha o menu e devolve o foco ao botão.
- `assets/js/kit.js` desenha a espiral de logos em canvas, com interação por ponteiro e rolagem. A rotação automática respeita a preferência por movimento reduzido; a lista de tecnologias também aparece em texto.
- `assets/img/kit/` contém as logos usadas na espiral, e `Logos/` preserva os arquivos de origem.
- `assets/docs/Curriculo Raulnik Royce.pdf` contém o currículo disponível para download.

As tecnologias listadas nos projetos descrevem o que cada produto utiliza. O portfólio em si é uma página estática em HTML, CSS e JavaScript.

## Prévia local

Na raiz deste repositório, execute:

```bash
python -m http.server 8080 --bind 127.0.0.1
```

Abra http://127.0.0.1:8080/. A página principal também pode ser aberta diretamente, mas o servidor permite conferir recursos e downloads por HTTP.

O servidor padrão do Python não aplica os cabeçalhos do Vercel nem substitui automaticamente uma rota inexistente por `404.html`. Para conferir o visual da página de erro, abra `/404.html`; os caminhos de seus recursos começam na raiz do domínio.

## Validação

Confira as larguras de 360, 390, 768 e 1440 pixels, os vídeos, a espiral, o menu mobile e a navegação por teclado. Verifique os links dos projetos, o download do currículo, o foco visível e a preferência por movimento reduzido.

## Publicação

O Vercel publica a raiz do repositório sem build. A configuração em `vercel.json` define os cabeçalhos de segurança, incluindo as permissões para os vídeos incorporados do YouTube.

O domínio é `portfolio.raulnikroyce.dev`. Com a integração do repositório configurada, um push na branch de produção inicia o deploy. As alterações locais devem ser revisadas antes de commit e publicação.

## Autoria

Portfólio de Raulnik Royce, com evolução assistida por ferramentas de IA e revisão dos arquivos e da interface.
