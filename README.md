# 🗳️ VoteChain - Sistema de Votação On-Chain

Um sistema de votação simples e transparente construído em Solidity para a blockchain Ethereum.

## 📋 Funcionalidades

- ✅ **Criar votações** com múltiplas opções
- ✅ **Votar uma única vez** por endereço
- ✅ **Ver resultados** em tempo real
- ✅ **Finalizar votações** automaticamente
- ✅ **Determinar vencedor** automaticamente
- ✅ **Controle de tempo** para votações
- ✅ **Transparência total** na blockchain

## 🏗️ Estrutura do Projeto

```
votechain/
├── contracts/
│   └── VotingSystem.sol      # Contrato principal
├── scripts/
│   ├── deploy.js             # Script de deploy
│   └── example.js            # Exemplo de uso
├── test/
│   └── VotingSystem.test.js  # Testes do contrato
├── package.json              # Dependências
├── hardhat.config.js         # Configuração Hardhat
└── README.md                 # Documentação
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd votechain
```

2. Instale as dependências:
```bash
npm install
```

3. Compile os contratos:
```bash
npm run compile
```

## 🧪 Testes

Execute os testes para verificar se tudo está funcionando:

```bash
npm test
```

Os testes cobrem:
- Criação de votações
- Processo de votação
- Finalização de votações
- Consultas e verificações
- Casos de erro

## 📝 Como Usar

### 1. Deploy do Contrato

```bash
npm run deploy
```

### 2. Exemplo de Uso

Execute o exemplo completo:

```bash
npx hardhat run scripts/example.js
```

### 3. Interação Manual

#### Criar uma Votação
```javascript
const title = "Qual sua cor favorita?";
const description = "Vote na sua cor preferida";
const duration = 3600; // 1 hora em segundos
const options = ["Vermelho", "Azul", "Verde"];

const tx = await votingSystem.createPoll(title, description, duration, options);
```

#### Votar
```javascript
const pollId = 0; // ID da votação
const optionIndex = 0; // Índice da opção (0 = primeira opção)

await votingSystem.vote(pollId, optionIndex);
```

#### Finalizar Votação
```javascript
await votingSystem.finalizePoll(pollId);
```

#### Ver Resultado
```javascript
const result = await votingSystem.getFinalResult(pollId);
console.log(`Vencedor: ${result.winningOptionName}`);
console.log(`Votos: ${result.winningVotes}`);
```

## 🔧 Funcionalidades do Contrato

### Estruturas de Dados

#### Poll (Votação)
```solidity
struct Poll {
    string title;           // Título da votação
    string description;     // Descrição
    uint256 startTime;      // Tempo de início
    uint256 endTime;        // Tempo de fim
    bool isActive;          // Se está ativa
    bool isFinalized;       // Se foi finalizada
    address creator;        // Criador
    uint256 totalVotes;     // Total de votos
    uint256 winningOption;  // Índice da opção vencedora
}
```

#### Option (Opção)
```solidity
struct Option {
    string name;        // Nome da opção
    uint256 voteCount;  // Número de votos
    bool exists;        // Se existe
}
```

### Funções Principais

#### `createPoll(title, description, duration, options)`
- Cria uma nova votação
- Retorna o ID da votação criada
- Requer pelo menos 2 opções

#### `vote(pollId, optionIndex)`
- Vota em uma opção específica
- Cada endereço pode votar apenas uma vez
- Só funciona em votações ativas

#### `finalizePoll(pollId)`
- Finaliza a votação e determina o vencedor
- Só pode ser chamada pelo criador
- Só funciona após o tempo da votação

#### `getPollInfo(pollId)`
- Retorna informações completas da votação

#### `getOptionInfo(pollId, optionIndex)`
- Retorna informações de uma opção específica

#### `getFinalResult(pollId)`
- Retorna o resultado final da votação
- Só funciona após finalização

## 🛡️ Segurança

### Modificadores de Segurança
- `onlyPollCreator`: Apenas o criador pode finalizar
- `pollExists`: Verifica se a votação existe
- `pollActive`: Verifica se a votação está ativa
- `pollNotFinalized`: Verifica se não foi finalizada

### Validações
- Título não pode estar vazio
- Mínimo de 2 opções
- Duração maior que zero
- Voto único por endereço
- Opção válida
- Tempo da votação respeitado

## 📊 Eventos

O contrato emite eventos para rastreamento:

- `PollCreated`: Quando uma votação é criada
- `VoteCast`: Quando um voto é registrado
- `PollFinalized`: Quando uma votação é finalizada

## 🔍 Consultas

### Verificar se Endereço Votou
```javascript
const hasVoted = await votingSystem.checkIfVoted(pollId, address);
```

### Total de Votações
```javascript
const totalPolls = await votingSystem.getTotalPolls();
```

### Informações da Votação
```javascript
const pollInfo = await votingSystem.getPollInfo(pollId);
```

## 🎯 Casos de Uso

1. **Votações Corporativas**: Decisões de equipe
2. **Pesquisas de Opinião**: Enquetes públicas
3. **Governança**: Votações de DAOs
4. **Eventos**: Escolha de local, data, etc.
5. **Produtos**: Feedback de usuários

## 🚨 Limitações

- Votação baseada em endereços (não identidade real)
- Sem sistema de pesos para votos
- Sem votação secreta
- Sem sistema de delegados

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Viviane Rodrigues**

---

⭐ Se este projeto foi útil, considere dar uma estrela!
