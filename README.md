# News by AI - API de Geração de Notícias

Uma API REST desenvolvida em NestJS que utiliza a API do Google Gemini para gerar notícias em português brasileiro baseadas em tópicos específicos.

## 🚀 Tecnologias

- **NestJS** - Framework Node.js para construção de aplicações escaláveis
- **Google Gemini AI** - API de IA para geração de conteúdo
- **Redis** - Cache e rate limiting
- **TypeScript** - Linguagem de programação
- **Docker** - Containerização

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- Redis (opcional, mas recomendado para produção)
- Chave da API do Google Gemini

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/joaoleite2/news-by-ai-back.git
cd news-by-ai-back
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Chave da API do Google Gemini (obrigatória)
GEMINI_API_KEY=sua_chave_aqui

# Prompt de inicialização para o Gemini (obrigatório)
GEMINI_IGNITION_PROMPT=seu_prompt_aqui

# URL do Redis (opcional - se não configurado, o middleware será desabilitado)
REDIS_URL=rediss://sua_url_redis

# Porta da aplicação (opcional, padrão: 8080)
PORT=8080
```

### 3.1. Como obter sua chave da API do Google Gemini

1. Acesse o [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key" (Criar chave da API)
4. Copie a chave gerada e cole no arquivo `.env`

**Nota:** A chave da API é gratuita e permite até 15 requisições por minuto e 1500 por dia.

### 3.2. Exemplo do Prompt de Ignição

Aqui está um exemplo do prompt que você deve configurar na variável `GEMINI_IGNITION_PROMPT`:

```
Você é um jornalista de IA. Seu trabalho é pesquisar notícias reais e recentes com base nos tópicos fornecidos pelo usuário e retornar um texto escrito em português brasileiro (PT-BR), formatado de acordo com o estilo escolhido pelo usuário. O usuário enviará algo como: topics: ['Tecnologia', 'Cultura'], textType: 'Leitura Detalhada'. 

Com base nos tópicos, sua principal tarefa é encontrar uma ou mais notícias que correlacionem e conectem TODOS os temas listados. A notícia resultante deve tratar da interseção dos temas. Por exemplo, se os tópicos forem ['Esportes', 'Tecnologia'], você deve encontrar uma notícia sobre o uso de tecnologia nos esportes (como VAR ou análise de dados de atletas), e NÃO uma notícia separada para cada tema. A notícia deve ser uma única matéria, unindo todos os temas.

A pesquisa, materiais, notícias, citações e outras referências podem estar em qualquer idioma, mas a resposta final deve ser SEMPRE em português brasileiro (PT-BR).

Use o campo textType para definir como você escreverá o texto:
- Se textType for "Leitura Rápida", retorne uma versão curta e resumida com as informações essenciais, usando texto conciso.
- Se textType for "Leitura Detalhada", retorne uma versão completa com contexto, nomes, datas e desenvolvimento claro do tema.
- Se textType for "Pontos-Chave", escreva o conteúdo em formato de resumo com marcadores usando quebras de linha (\n) ou prefixos com traços (-) dentro do texto.

O conteúdo retornado deve ser um objeto JSON com a seguinte estrutura:
{ "title": "string", "text": "string", "font": ["string"] }.

- title: o título principal da notícia.
- text: o corpo da notícia escrito totalmente em português brasileiro (PT-BR) e formatado de acordo com o textType selecionado.
- font: um array com nomes de fontes ou URLs onde a notícia foi baseada. Não inclua números ou códigos de referência.

Sempre envolva toda a sua resposta em um bloco markdown JSON. Nunca inclua explicações ou textos fora desse bloco. Retorne apenas o objeto dentro do bloco.
```

**Importante:** O prompt especifica explicitamente que a resposta deve ser em português brasileiro (PT-BR) para evitar confusão sobre o idioma de resposta.

### 4. ⚠️ Importante: Configuração do Redis

**Se você não tiver um Redis configurado**, a aplicação irá falhar ao iniciar devido ao middleware de rate limiting. Para resolver isso, você tem duas opções:

#### Opção 1: Desabilitar o middleware (Recomendado para desenvolvimento)
Comente ou remova a configuração do middleware no arquivo `src/app.module.ts`:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NewsModule,
    // Comente `RedisModule` para desabilitar o rate limiter
    RedisModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Comente o `consumer` para desabilitar o rate limiter
    consumer
      .apply(RateLimiterMiddleware)
      .forRoutes('news');
  }
}
```

#### Opção 2: Configurar um Redis
- Use um serviço como Redis Cloud, Upstash ou configure localmente
- Configure a variável `REDIS_URL` no arquivo `.env`

## 🏃‍♂️ Executando a aplicação

### Desenvolvimento
```bash
npm run start:dev
```

### Produção
```bash
npm run build
npm run start:prod
```

### Docker
```bash
docker build -t news-by-ai-api .
docker run -p 8080:8080 news-by-ai-api
```

## 📡 Endpoints da API

### POST `/news`

Gera uma notícia baseada nos tópicos fornecidos.

**Corpo da requisição:**
```json
{
  "topics": ["Entretenimento", "Meio Ambiente"],
  "textType": "Leitura Rápida"
}
```

**Parâmetros:**
- `topics` (array): Lista de tópicos para a notícia
- `textType` (string): Tipo de texto desejado
  - `"Leitura Rápida"` - Versão resumida
  - `"Leitura Detalhada"` - Versão completa
  - `"Pontos-Chave"` - Lista de pontos principais

**Resposta de sucesso:**
```json
{
  "title": "Título da Notícia",
  "text": "Conteúdo da notícia em português brasileiro...",
  "font": "Fonte da notícia"
}
```

**Códigos de status:**
- `200` - Sucesso
- `400` - Dados inválidos
- `404` - Não foi possível gerar a notícia
- `429` - Limite de requisições excedido (se Redis estiver configurado)
- `503` - Serviço Redis indisponível (se Redis estiver configurado)

## 🔧 Rate Limiting

A API possui um sistema de rate limiting que limita cada IP a **8 requisições por dia**. Este sistema:

- Utiliza Redis para armazenar as contagens
- Reseta automaticamente após 24 horas
- Retorna erro 429 quando o limite é excedido

**Nota:** O rate limiting só funciona se o Redis estiver configurado. Caso contrário, a aplicação não iniciará.

## 🎯 Tipos de Formato de Resposta

A API suporta diferentes formatos de resposta baseados no prompt configurado:

1. **Texto Normal** - Texto simples em português
2. **Markdown** - Formato README com estrutura markdown
3. **HTML** - Estrutura HTML completa
4. **JSON** - Objeto estruturado com título, texto e fonte

## 🐛 Solução de Problemas

### Erro: "Serviço Redis não disponível"
- Configure a variável `REDIS_URL` no `.env`
- Ou desabilite o middleware conforme instruído acima

### Erro: "GEMINI_API_KEY não está configurada"
- Verifique se a variável `GEMINI_API_KEY` está definida no `.env`

### Erro: "Prompt não configurado"
- Configure a variável `GEMINI_IGNITION_PROMPT` no `.env`

### Erro: "Não foi possível gerar uma notícia válida"
- A API tenta até 4 vezes gerar uma notícia válida
- Verifique se os tópicos fornecidos são adequados

## 📝 Scripts Disponíveis

```bash
npm run build          # Compila o projeto
npm run start          # Inicia em modo produção
npm run start:dev      # Inicia em modo desenvolvimento
npm run start:debug    # Inicia em modo debug
npm run lint           # Executa o linter
npm run test           # Executa os testes
```

## 🔒 CORS

A API está configurada para aceitar requisições dos seguintes domínios:
- `http://localhost:3000`
- `https://eai-news-git-main-joaoleite2s-projects.vercel.app`

## 📄 Licença

Este projeto está sob licença não licenciada (UNLICENSED).