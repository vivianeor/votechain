# 📚 Exemplos Práticos - VoteChain

Este documento contém exemplos práticos de como usar o sistema de votação VoteChain.

## 🚀 Início Rápido

### 1. Instalação e Configuração

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd votechain

# Instale as dependências
npm install

# Compile os contratos
npm run compile

# Execute os testes
npm test
```

### 2. Deploy do Contrato

```bash
# Deploy local
npx hardhat run scripts/deploy.js --network localhost

# Deploy em rede de teste (ex: Sepolia)
npx hardhat run scripts/deploy.js --network sepolia
```

## 🎯 Exemplos de Uso

### Exemplo 1: Votação Simples

```javascript
const { ethers } = require("hardhat");

async function exemploVotacaoSimples() {
  // 1. Deploy do contrato
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy();
  
  const [owner, voter1, voter2, voter3] = await ethers.getSigners();

  // 2. Criar votação
  const title = "Qual sua cor favorita?";
  const description = "Vote na sua cor preferida";
  const duration = 3600; // 1 hora
  const options = ["Vermelho", "Azul", "Verde"];

  const tx = await votingSystem.createPoll(title, description, duration, options);
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => {
    try {
      const parsedLog = votingSystem.interface.parseLog(log);
      return parsedLog.name === "PollCreated";
    } catch {
      return false;
    }
  });
  const parsedEvent = votingSystem.interface.parseLog(event);
  const pollId = parsedEvent.args.pollId;

  console.log(`Votação criada com ID: ${pollId}`);

  // 3. Votar
  await votingSystem.connect(voter1).vote(pollId, 0); // Vermelho
  await votingSystem.connect(voter2).vote(pollId, 1); // Azul
  await votingSystem.connect(voter3).vote(pollId, 0); // Vermelho

  // 4. Verificar resultados
  const pollInfo = await votingSystem.getPollInfo(pollId);
  console.log(`Total de votos: ${pollInfo.totalVotes}`);

  // 5. Finalizar votação (após o tempo)
  await ethers.provider.send("evm_increaseTime", [3601]);
  await ethers.provider.send("evm_mine");
  
  await votingSystem.finalizePoll(pollId);

  // 6. Ver resultado final
  const result = await votingSystem.getFinalResult(pollId);
  console.log(`Vencedor: ${result.winningOptionName}`);
  console.log(`Votos: ${result.winningVotes}`);
}

exemploVotacaoSimples();
```

### Exemplo 2: Votação Corporativa

```javascript
async function votacaoCorporativa() {
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy();
  
  const [ceo, manager1, manager2, manager3, employee1, employee2] = await ethers.getSigners();

  // Votação sobre local do próximo evento da empresa
  const title = "Local do Evento Anual 2024";
  const description = "Escolha o local para o evento anual da empresa";
  const duration = 86400; // 24 horas
  const options = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba"];

  const tx = await votingSystem.createPoll(title, description, duration, options);
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => {
    try {
      const parsedLog = votingSystem.interface.parseLog(log);
      return parsedLog.name === "PollCreated";
    } catch {
      return false;
    }
  });
  const parsedEvent = votingSystem.interface.parseLog(event);
  const pollId = parsedEvent.args.pollId;

  // Votação dos funcionários
  await votingSystem.connect(ceo).vote(pollId, 0);      // São Paulo
  await votingSystem.connect(manager1).vote(pollId, 1); // Rio de Janeiro
  await votingSystem.connect(manager2).vote(pollId, 0); // São Paulo
  await votingSystem.connect(manager3).vote(pollId, 2); // Belo Horizonte
  await votingSystem.connect(employee1).vote(pollId, 0); // São Paulo
  await votingSystem.connect(employee2).vote(pollId, 3); // Curitiba

  // Verificar resultados em tempo real
  for (let i = 0; i < options.length; i++) {
    const optionInfo = await votingSystem.getOptionInfo(pollId, i);
    console.log(`${options[i]}: ${optionInfo.voteCount} votos`);
  }

  // Finalizar após 24 horas
  await ethers.provider.send("evm_increaseTime", [86401]);
  await ethers.provider.send("evm_mine");
  
  await votingSystem.finalizePoll(pollId);

  const result = await votingSystem.getFinalResult(pollId);
  console.log(`🏆 Local escolhido: ${result.winningOptionName}`);
}
```

### Exemplo 3: Pesquisa de Opinião

```javascript
async function pesquisaOpiniao() {
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy();
  
  const [admin, user1, user2, user3, user4, user5] = await ethers.getSigners();

  // Pesquisa sobre preferência de streaming
  const title = "Qual sua plataforma de streaming favorita?";
  const description = "Vote na plataforma que você mais usa";
  const duration = 604800; // 1 semana
  const options = ["Netflix", "Disney+", "Amazon Prime", "HBO Max", "Outros"];

  const tx = await votingSystem.createPoll(title, description, duration, options);
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => {
    try {
      const parsedLog = votingSystem.interface.parseLog(log);
      return parsedLog.name === "PollCreated";
    } catch {
      return false;
    }
  });
  const parsedEvent = votingSystem.interface.parseLog(event);
  const pollId = parsedEvent.args.pollId;

  // Votação dos usuários
  await votingSystem.connect(user1).vote(pollId, 0); // Netflix
  await votingSystem.connect(user2).vote(pollId, 0); // Netflix
  await votingSystem.connect(user3).vote(pollId, 1); // Disney+
  await votingSystem.connect(user4).vote(pollId, 2); // Amazon Prime
  await votingSystem.connect(user5).vote(pollId, 0); // Netflix

  // Verificar se usuário já votou
  const hasVoted = await votingSystem.checkIfVoted(pollId, user1.address);
  console.log(`Usuário 1 já votou: ${hasVoted}`);

  // Tentar votar novamente (deve falhar)
  try {
    await votingSystem.connect(user1).vote(pollId, 1);
  } catch (error) {
    console.log("Erro esperado: Usuário já votou");
  }

  // Finalizar pesquisa
  await ethers.provider.send("evm_increaseTime", [604801]);
  await ethers.provider.send("evm_mine");
  
  await votingSystem.finalizePoll(pollId);

  const result = await votingSystem.getFinalResult(pollId);
  console.log(`📊 Resultado da pesquisa:`);
  console.log(`Plataforma mais popular: ${result.winningOptionName}`);
  console.log(`Votos recebidos: ${result.winningVotes}`);
}
```

### Exemplo 4: Votação de DAO

```javascript
async function votacaoDAO() {
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy();
  
  const [daoAdmin, member1, member2, member3, member4, member5] = await ethers.getSigners();

  // Proposta de DAO
  const title = "Proposta: Investir em Novo Projeto DeFi";
  const description = "Vote se devemos investir 100 ETH no novo projeto DeFi";
  const duration = 259200; // 3 dias
  const options = ["Aprovar", "Rejeitar", "Abster-se"];

  const tx = await votingSystem.createPoll(title, description, duration, options);
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => {
    try {
      const parsedLog = votingSystem.interface.parseLog(log);
      return parsedLog.name === "PollCreated";
    } catch {
      return false;
    }
  });
  const parsedEvent = votingSystem.interface.parseLog(event);
  const pollId = parsedEvent.args.pollId;

  // Votação dos membros
  await votingSystem.connect(member1).vote(pollId, 0); // Aprovar
  await votingSystem.connect(member2).vote(pollId, 0); // Aprovar
  await votingSystem.connect(member3).vote(pollId, 1); // Rejeitar
  await votingSystem.connect(member4).vote(pollId, 2); // Abster-se
  await votingSystem.connect(member5).vote(pollId, 0); // Aprovar

  // Verificar quórum (pelo menos 3 votos)
  const pollInfo = await votingSystem.getPollInfo(pollId);
  const quorum = pollInfo.totalVotes >= 3;
  console.log(`Quórum atingido: ${quorum}`);

  // Finalizar votação
  await ethers.provider.send("evm_increaseTime", [259201]);
  await ethers.provider.send("evm_mine");
  
  await votingSystem.finalizePoll(pollId);

  const result = await votingSystem.getFinalResult(pollId);
  console.log(`🗳️ Resultado da votação DAO:`);
  console.log(`Decisão: ${result.winningOptionName}`);
  console.log(`Votos: ${result.winningVotes}`);
}
```

## 🔧 Funções Úteis

### Verificar Informações da Votação

```javascript
async function verificarVotacao(pollId) {
  const pollInfo = await votingSystem.getPollInfo(pollId);
  
  console.log("📋 Informações da Votação:");
  console.log(`Título: ${pollInfo.title}`);
  console.log(`Descrição: ${pollInfo.description}`);
  console.log(`Criador: ${pollInfo.creator}`);
  console.log(`Início: ${new Date(pollInfo.startTime * 1000)}`);
  console.log(`Fim: ${new Date(pollInfo.endTime * 1000)}`);
  console.log(`Ativa: ${pollInfo.isActive}`);
  console.log(`Finalizada: ${pollInfo.isFinalized}`);
  console.log(`Total de votos: ${pollInfo.totalVotes}`);
}

// Verificar todas as opções
async function verificarOpcoes(pollId) {
  console.log("🗳️ Opções disponíveis:");
  
  for (let i = 0; ; i++) {
    try {
      const optionInfo = await votingSystem.getOptionInfo(pollId, i);
      if (!optionInfo.exists) break;
      
      console.log(`${i}: ${optionInfo.name} (${optionInfo.voteCount} votos)`);
    } catch {
      break;
    }
  }
}
```

### Verificar Status de Votação

```javascript
async function verificarStatusVotacao(pollId, address) {
  const hasVoted = await votingSystem.checkIfVoted(pollId, address);
  const pollInfo = await votingSystem.getPollInfo(pollId);
  
  console.log(`👤 Status do endereço ${address}:`);
  console.log(`Já votou: ${hasVoted}`);
  console.log(`Votação ativa: ${pollInfo.isActive}`);
  console.log(`Votação finalizada: ${pollInfo.isFinalized}`);
  
  if (pollInfo.isFinalized) {
    const result = await votingSystem.getFinalResult(pollId);
    console.log(`Vencedor: ${result.winningOptionName}`);
  }
}
```

## 🚨 Tratamento de Erros

```javascript
async function votarComTratamentoErro(pollId, optionIndex) {
  try {
    await votingSystem.vote(pollId, optionIndex);
    console.log("✅ Voto registrado com sucesso!");
  } catch (error) {
    if (error.message.includes("Votacao nao existe")) {
      console.log("❌ Votação não encontrada");
    } else if (error.message.includes("Voce ja votou")) {
      console.log("❌ Você já votou nesta votação");
    } else if (error.message.includes("Opcao invalida")) {
      console.log("❌ Opção inválida");
    } else if (error.message.includes("Votacao ja terminou")) {
      console.log("❌ Votação já terminou");
    } else {
      console.log("❌ Erro desconhecido:", error.message);
    }
  }
}
```

## 📊 Análise de Resultados

```javascript
async function analisarResultados(pollId) {
  const pollInfo = await votingSystem.getPollInfo(pollId);
  
  if (!pollInfo.isFinalized) {
    console.log("⚠️ Votação ainda não foi finalizada");
    return;
  }

  console.log("📊 Análise dos Resultados:");
  console.log(`Total de votos: ${pollInfo.totalVotes}`);
  
  let totalVotes = 0;
  const options = [];
  
  // Coletar dados de todas as opções
  for (let i = 0; ; i++) {
    try {
      const optionInfo = await votingSystem.getOptionInfo(pollId, i);
      if (!optionInfo.exists) break;
      
      options.push({
        name: optionInfo.name,
        votes: optionInfo.voteCount,
        percentage: 0
      });
      totalVotes += optionInfo.voteCount;
    } catch {
      break;
    }
  }
  
  // Calcular percentuais
  options.forEach(option => {
    option.percentage = totalVotes > 0 ? (option.votes / totalVotes * 100).toFixed(1) : 0;
  });
  
  // Ordenar por votos
  options.sort((a, b) => b.votes - a.votes);
  
  // Exibir resultados
  options.forEach((option, index) => {
    console.log(`${index + 1}. ${option.name}: ${option.votes} votos (${option.percentage}%)`);
  });
  
  const result = await votingSystem.getFinalResult(pollId);
  console.log(`\n🏆 Vencedor: ${result.winningOptionName} com ${result.winningVotes} votos`);
}
```

## 🎯 Casos de Uso Comuns

1. **Votações Corporativas**: Decisões de equipe, escolha de projetos
2. **Pesquisas de Opinião**: Enquetes públicas, feedback de usuários
3. **Governança de DAOs**: Propostas, mudanças de protocolo
4. **Eventos**: Escolha de local, data, tema
5. **Produtos**: Features prioritárias, melhorias
6. **Comunidades**: Decisões coletivas, eleições

## 🔒 Considerações de Segurança

- Cada endereço pode votar apenas uma vez por votação
- Apenas o criador pode finalizar a votação
- Votações têm tempo limite definido
- Resultados são imutáveis após finalização
- Transparência total na blockchain

---

Para mais informações, consulte o [README.md](README.md) principal.
