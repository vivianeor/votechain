const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingSystem", function () {
  let votingSystem;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    votingSystem = await VotingSystem.deploy();
  });

  describe("Criacao de Votacao", function () {
    it("Deve criar uma votacao com sucesso", async function () {
      const title = "Qual sua cor favorita?";
      const description = "Vote na sua cor preferida";
      const duration = 3600; // 1 hora
      const options = ["Vermelho", "Azul", "Verde"];

      await expect(votingSystem.createPoll(title, description, duration, options))
        .to.emit(votingSystem, "PollCreated")
        .withArgs(0, title, owner.address);

      const pollInfo = await votingSystem.getPollInfo(0);
      expect(pollInfo.title).to.equal(title);
      expect(pollInfo.description).to.equal(description);
      expect(pollInfo.creator).to.equal(owner.address);
      expect(pollInfo.isActive).to.be.true;
      expect(pollInfo.isFinalized).to.be.false;
    });

    it("Deve falhar ao criar votacao com titulo vazio", async function () {
      const title = "";
      const description = "Descricao";
      const duration = 3600;
      const options = ["Opcao 1", "Opcao 2"];

      await expect(
        votingSystem.createPoll(title, description, duration, options)
      ).to.be.revertedWith("Titulo nao pode estar vazio");
    });

    it("Deve falhar ao criar votacao com menos de 2 opcoes", async function () {
      const title = "Titulo";
      const description = "Descricao";
      const duration = 3600;
      const options = ["Opcao 1"];

      await expect(
        votingSystem.createPoll(title, description, duration, options)
      ).to.be.revertedWith("Deve ter pelo menos 2 opcoes");
    });

    it("Deve falhar ao criar votacao com duracao zero", async function () {
      const title = "Titulo";
      const description = "Descricao";
      const duration = 0;
      const options = ["Opcao 1", "Opcao 2"];

      await expect(
        votingSystem.createPoll(title, description, duration, options)
      ).to.be.revertedWith("Duracao deve ser maior que zero");
    });
  });

  describe("Votacao", function () {
    let pollId;

    beforeEach(async function () {
      const title = "Qual sua cor favorita?";
      const description = "Vote na sua cor preferida";
      const duration = 3600;
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
      pollId = parsedEvent.args.pollId;
    });

    it("Deve permitir votar em uma opcao", async function () {
      await expect(votingSystem.connect(addr1).vote(pollId, 0))
        .to.emit(votingSystem, "VoteCast")
        .withArgs(pollId, addr1.address, 0);

      const optionInfo = await votingSystem.getOptionInfo(pollId, 0);
      expect(optionInfo.voteCount).to.equal(1);

      const hasVoted = await votingSystem.checkIfVoted(pollId, addr1.address);
      expect(hasVoted).to.be.true;
    });

    it("Deve falhar ao votar duas vezes na mesma votacao", async function () {
      await votingSystem.connect(addr1).vote(pollId, 0);

      await expect(
        votingSystem.connect(addr1).vote(pollId, 1)
      ).to.be.revertedWith("Voce ja votou nesta votacao");
    });

    it("Deve falhar ao votar em opcao invalida", async function () {
      await expect(
        votingSystem.connect(addr1).vote(pollId, 10)
      ).to.be.revertedWith("Opcao invalida");
    });

    it("Deve permitir que diferentes enderecos votem", async function () {
      await votingSystem.connect(addr1).vote(pollId, 0);
      await votingSystem.connect(addr2).vote(pollId, 1);
      await votingSystem.connect(addr3).vote(pollId, 2);

      const pollInfo = await votingSystem.getPollInfo(pollId);
      expect(pollInfo.totalVotes).to.equal(3);

      const option0 = await votingSystem.getOptionInfo(pollId, 0);
      const option1 = await votingSystem.getOptionInfo(pollId, 1);
      const option2 = await votingSystem.getOptionInfo(pollId, 2);

      expect(option0.voteCount).to.equal(1);
      expect(option1.voteCount).to.equal(1);
      expect(option2.voteCount).to.equal(1);
    });
  });

  describe("Finalizacao de Votacao", function () {
    let pollId;

    beforeEach(async function () {
      const title = "Qual sua cor favorita?";
      const description = "Vote na sua cor preferida";
      const duration = 60; // 60 segundos para dar tempo suficiente
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
      pollId = parsedEvent.args.pollId;
    });

    it("Deve finalizar votacao e determinar vencedor", async function () {
      // Vota nas opcoes imediatamente
      await votingSystem.connect(addr1).vote(pollId, 0); // Vermelho
      await votingSystem.connect(addr2).vote(pollId, 0); // Vermelho
      await votingSystem.connect(addr3).vote(pollId, 1); // Azul

      // Aguarda o tempo da votacao
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      // Finaliza a votacao
      await expect(votingSystem.finalizePoll(pollId))
        .to.emit(votingSystem, "PollFinalized")
        .withArgs(pollId, 0);

      const pollInfo = await votingSystem.getPollInfo(pollId);
      expect(pollInfo.isActive).to.be.false;
      expect(pollInfo.isFinalized).to.be.true;
      expect(pollInfo.winningOption).to.equal(0);

      const result = await votingSystem.getFinalResult(pollId);
      expect(result.winningOptionName).to.equal("Vermelho");
      expect(result.winningVotes).to.equal(2);
    });

    it("Deve falhar ao finalizar votacao antes do tempo", async function () {
      await expect(
        votingSystem.finalizePoll(pollId)
      ).to.be.revertedWith("Votacao ainda nao terminou");
    });

    it("Deve falhar ao finalizar votacao por nao-criador", async function () {
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await expect(
        votingSystem.connect(addr1).finalizePoll(pollId)
      ).to.be.revertedWith("Apenas o criador pode executar esta acao");
    });

    it("Deve falhar ao finalizar votacao duas vezes", async function () {
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await votingSystem.finalizePoll(pollId);

      await expect(
        votingSystem.finalizePoll(pollId)
      ).to.be.revertedWith("Votacao ja foi finalizada");
    });
  });

  describe("Consultas", function () {
    let pollId;

    beforeEach(async function () {
      const title = "Qual sua cor favorita?";
      const description = "Vote na sua cor preferida";
      const duration = 3600;
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
      pollId = parsedEvent.args.pollId;
    });

    it("Deve retornar informacoes corretas da votacao", async function () {
      const pollInfo = await votingSystem.getPollInfo(pollId);
      
      expect(pollInfo.title).to.equal("Qual sua cor favorita?");
      expect(pollInfo.description).to.equal("Vote na sua cor preferida");
      expect(pollInfo.creator).to.equal(owner.address);
      expect(pollInfo.totalVotes).to.equal(0);
      expect(pollInfo.isActive).to.be.true;
      expect(pollInfo.isFinalized).to.be.false;
    });

    it("Deve retornar informacoes corretas das opcoes", async function () {
      const option0 = await votingSystem.getOptionInfo(pollId, 0);
      const option1 = await votingSystem.getOptionInfo(pollId, 1);
      const option2 = await votingSystem.getOptionInfo(pollId, 2);

      expect(option0.name).to.equal("Vermelho");
      expect(option0.voteCount).to.equal(0);
      expect(option0.exists).to.be.true;

      expect(option1.name).to.equal("Azul");
      expect(option1.voteCount).to.equal(0);
      expect(option1.exists).to.be.true;

      expect(option2.name).to.equal("Verde");
      expect(option2.voteCount).to.equal(0);
      expect(option2.exists).to.be.true;
    });

    it("Deve retornar total de votacoes criadas", async function () {
      expect(await votingSystem.getTotalPolls()).to.equal(1);

      // Cria mais uma votacao
      const title = "Nova votacao";
      const description = "Descricao";
      const duration = 3600;
      const options = ["Opcao 1", "Opcao 2"];

      await votingSystem.createPoll(title, description, duration, options);
      expect(await votingSystem.getTotalPolls()).to.equal(2);
    });

    it("Deve verificar corretamente se endereco votou", async function () {
      expect(await votingSystem.checkIfVoted(pollId, addr1.address)).to.be.false;

      await votingSystem.connect(addr1).vote(pollId, 0);
      expect(await votingSystem.checkIfVoted(pollId, addr1.address)).to.be.true;
    });
  });

  describe("Casos de Erro", function () {
    it("Deve falhar ao acessar votacao inexistente", async function () {
      await expect(
        votingSystem.getPollInfo(999)
      ).to.be.revertedWith("Votacao nao existe");
    });

    it("Deve falhar ao votar em votacao inexistente", async function () {
      await expect(
        votingSystem.connect(addr1).vote(999, 0)
      ).to.be.revertedWith("Votacao nao existe");
    });

    it("Deve falhar ao obter resultado de votacao nao finalizada", async function () {
      const title = "Titulo";
      const description = "Descricao";
      const duration = 3600;
      const options = ["Opcao 1", "Opcao 2"];

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

      await expect(
        votingSystem.getFinalResult(pollId)
      ).to.be.revertedWith("Votacao ainda nao foi finalizada");
    });
  });
});
