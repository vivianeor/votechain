const { ethers } = require("hardhat");

async function main() {
  console.log("🎯 Exemplo de uso do sistema de votacao\n");

  // Obtem o contrato (assumindo que ja foi deployado)
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy();
  await votingSystem.waitForDeployment();

  const [owner, voter1, voter2, voter3] = await ethers.getSigners();

  console.log("👤 Criador da votacao:", owner.address);
  console.log("👥 Votantes:", [voter1.address, voter2.address, voter3.address].join(", "));

  // 1. Criar uma votacao
  console.log("\n📝 1. Criando votacao...");
  const title = "Qual sua cor favorita?";
  const description = "Vote na sua cor preferida";
  const duration = 3600; // 1 hora
  const options = ["Vermelho", "Azul", "Verde"];

  const createTx = await votingSystem.createPoll(title, description, duration, options);
  const createReceipt = await createTx.wait();
  const createEvent = createReceipt.logs.find(log => {
    try {
      const parsedLog = votingSystem.interface.parseLog(log);
      return parsedLog.name === "PollCreated";
    } catch {
      return false;
    }
  });
  const parsedEvent = votingSystem.interface.parseLog(createEvent);
  const pollId = parsedEvent.args.pollId;

  console.log(`✅ Votacao criada com ID: ${pollId}`);
  console.log(`   Titulo: ${title}`);
  console.log(`   Opcoes: ${options.join(", ")}`);
  console.log(`   Duracao: ${duration} segundos`);

  // 2. Verificar informacoes da votacao
  console.log("\n📊 2. Informacoes da votacao:");
  const pollInfo = await votingSystem.getPollInfo(pollId);
  console.log(`   Titulo: ${pollInfo.title}`);
  console.log(`   Descricao: ${pollInfo.description}`);
  console.log(`   Criador: ${pollInfo.creator}`);
  console.log(`   Ativa: ${pollInfo.isActive}`);
  console.log(`   Total de votos: ${pollInfo.totalVotes}`);

  // 3. Verificar opcoes
  console.log("\n🗳️ 3. Opcoes disponiveis:");
  for (let i = 0; i < options.length; i++) {
    const optionInfo = await votingSystem.getOptionInfo(pollId, i);
    console.log(`   ${i}: ${optionInfo.name} (${optionInfo.voteCount} votos)`);
  }

  // 4. Votar
  console.log("\n🗳️ 4. Realizando votos...");
  
  // Votante 1 vota em Vermelho (opcao 0)
  await votingSystem.connect(voter1).vote(pollId, 0);
  console.log(`   ${voter1.address} votou em: ${options[0]}`);

  // Votante 2 vota em Azul (opcao 1)
  await votingSystem.connect(voter2).vote(pollId, 1);
  console.log(`   ${voter2.address} votou em: ${options[1]}`);

  // Votante 3 vota em Vermelho (opcao 0)
  await votingSystem.connect(voter3).vote(pollId, 0);
  console.log(`   ${voter3.address} votou em: ${options[0]}`);

  // 5. Verificar votos apos votacao
  console.log("\n📊 5. Resultado apos votacao:");
  const pollInfoAfter = await votingSystem.getPollInfo(pollId);
  console.log(`   Total de votos: ${pollInfoAfter.totalVotes}`);

  for (let i = 0; i < options.length; i++) {
    const optionInfo = await votingSystem.getOptionInfo(pollId, i);
    console.log(`   ${i}: ${optionInfo.name} (${optionInfo.voteCount} votos)`);
  }

  // 6. Verificar se votantes ja votaram
  console.log("\n✅ 6. Verificando se votantes ja votaram:");
  console.log(`   ${voter1.address}: ${await votingSystem.checkIfVoted(pollId, voter1.address)}`);
  console.log(`   ${voter2.address}: ${await votingSystem.checkIfVoted(pollId, voter2.address)}`);
  console.log(`   ${voter3.address}: ${await votingSystem.checkIfVoted(pollId, voter3.address)}`);

  // 7. Aguardar tempo da votacao e finalizar
  console.log("\n⏰ 7. Aguardando fim da votacao...");
  await ethers.provider.send("evm_increaseTime", [duration + 1]);
  await ethers.provider.send("evm_mine");

  console.log("🏁 Finalizando votacao...");
  const finalizeTx = await votingSystem.finalizePoll(pollId);
  await finalizeTx.wait();
  console.log("✅ Votacao finalizada!");

  // 8. Ver resultado final
  console.log("\n🏆 8. Resultado final:");
  const finalResult = await votingSystem.getFinalResult(pollId);
  console.log(`   Vencedor: ${finalResult.winningOptionName}`);
  console.log(`   Votos recebidos: ${finalResult.winningVotes}`);

  // 9. Verificar estado final da votacao
  console.log("\n📋 9. Estado final da votacao:");
  const finalPollInfo = await votingSystem.getPollInfo(pollId);
  console.log(`   Ativa: ${finalPollInfo.isActive}`);
  console.log(`   Finalizada: ${finalPollInfo.isFinalized}`);
  console.log(`   Opcao vencedora: ${finalPollInfo.winningOption}`);

  console.log("\n🎉 Exemplo concluido com sucesso!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erro no exemplo:", error);
    process.exit(1);
  });
