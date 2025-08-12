const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deploy do sistema de votacao...");

  // Obtem o contrato
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  
  // Deploy do contrato
  const votingSystem = await VotingSystem.deploy();
  await votingSystem.waitForDeployment();

  const address = await votingSystem.getAddress();
  console.log("✅ Contrato VotingSystem deployado em:", address);

  // Exemplo de uso do contrato
  console.log("\n📋 Exemplo de uso:");
  console.log("1. Criar uma votacao:");
  console.log(`   await votingSystem.createPoll("Qual sua cor favorita?", "Vote na sua cor preferida", 3600, ["Vermelho", "Azul", "Verde"]);`);
  
  console.log("\n2. Votar em uma opcao:");
  console.log(`   await votingSystem.vote(0, 0); // Vota na opcao 0 da votacao 0`);
  
  console.log("\n3. Finalizar votacao:");
  console.log(`   await votingSystem.finalizePoll(0);`);
  
  console.log("\n4. Ver resultado:");
  console.log(`   await votingSystem.getFinalResult(0);`);

  return address;
}

// Executa o deploy se chamado diretamente
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Erro no deploy:", error);
      process.exit(1);
    });
}

module.exports = { main };
