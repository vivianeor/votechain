// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingSystem {
    struct Option {
        string name;        // Nome da opção
        uint256 voteCount;  // Número de votos recebidos
        bool exists;        // Se a opção existe
    }
    
    // Estrutura para representar uma votação
    struct Poll {
        string title;           // Título da votação
        string description;     // Descrição da votação
        uint256 startTime;      // Tempo de início
        uint256 endTime;        // Tempo de fim
        bool isActive;          // Se a votação está ativa
        bool isFinalized;       // Se a votação foi finalizada
        address creator;        // Criador da votação
        uint256 totalVotes;     // Total de votos
        uint256 winningOption;  // Índice da opção vencedora
    }
    
    // Mapeamento de votações por ID
    mapping(uint256 => Poll) public polls;
    
    // Mapeamento de opções por ID da votação e índice da opção
    mapping(uint256 => mapping(uint256 => Option)) public pollOptions;
    
    // Mapeamento para controlar quem já votou em cada votação
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Contador de votações criadas
    uint256 public pollCount;
    
    // Eventos
    event PollCreated(uint256 indexed pollId, string title, address indexed creator);
    event VoteCast(uint256 indexed pollId, address indexed voter, uint256 optionIndex);
    event PollFinalized(uint256 indexed pollId, uint256 winningOption);
    
    // Modificadores
    modifier onlyPollCreator(uint256 _pollId) {
        require(polls[_pollId].creator == msg.sender, "Apenas o criador pode executar esta acao");
        _;
    }
    
    modifier pollExists(uint256 _pollId) {
        require(_pollId < pollCount, "Votacao nao existe");
        _;
    }
    
    modifier pollActive(uint256 _pollId) {
        require(polls[_pollId].isActive, "Votacao nao esta ativa");
        _;
    }
    
    modifier pollNotFinalized(uint256 _pollId) {
        require(!polls[_pollId].isFinalized, "Votacao ja foi finalizada");
        _;
    }
    
    /**
     * @dev Cria uma nova votação
     * @param _title Título da votação
     * @param _description Descrição da votação
     * @param _duration Duração da votação em segundos
     * @param _options Array com os nomes das opções
     */
    function createPoll(
        string memory _title,
        string memory _description,
        uint256 _duration,
        string[] memory _options
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Titulo nao pode estar vazio");
        require(_options.length >= 2, "Deve ter pelo menos 2 opcoes");
        require(_duration > 0, "Duracao deve ser maior que zero");
        
        uint256 pollId = pollCount;
        
        polls[pollId] = Poll({
            title: _title,
            description: _description,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            isActive: true,
            isFinalized: false,
            creator: msg.sender,
            totalVotes: 0,
            winningOption: 0
        });
        
        // Adiciona as opções
        for (uint256 i = 0; i < _options.length; i++) {
            require(bytes(_options[i]).length > 0, "Nome da opcao nao pode estar vazio");
            pollOptions[pollId][i] = Option({
                name: _options[i],
                voteCount: 0,
                exists: true
            });
        }
        
        pollCount++;
        
        emit PollCreated(pollId, _title, msg.sender);
        return pollId;
    }
    
    /**
     * @dev Vota em uma opção específica
     * @param _pollId ID da votação
     * @param _optionIndex Índice da opção escolhida
     */
    function vote(uint256 _pollId, uint256 _optionIndex) 
        external 
        pollExists(_pollId) 
        pollActive(_pollId) 
        pollNotFinalized(_pollId) 
    {
        require(block.timestamp <= polls[_pollId].endTime, "Votacao ja terminou");
        require(!hasVoted[_pollId][msg.sender], "Voce ja votou nesta votacao");
        require(pollOptions[_pollId][_optionIndex].exists, "Opcao invalida");
        
        // Registra o voto
        hasVoted[_pollId][msg.sender] = true;
        pollOptions[_pollId][_optionIndex].voteCount++;
        polls[_pollId].totalVotes++;
        
        emit VoteCast(_pollId, msg.sender, _optionIndex);
    }
    
    /**
     * @dev Finaliza a votação e determina o vencedor
     * @param _pollId ID da votação
     */
    function finalizePoll(uint256 _pollId) 
        external 
        pollExists(_pollId) 
        onlyPollCreator(_pollId) 
        pollNotFinalized(_pollId) 
    {
        require(block.timestamp > polls[_pollId].endTime, "Votacao ainda nao terminou");
        
        polls[_pollId].isActive = false;
        polls[_pollId].isFinalized = true;
        
        // Encontra a opção vencedora
        uint256 winningOption = 0;
        uint256 maxVotes = 0;
        
        for (uint256 i = 0; pollOptions[_pollId][i].exists; i++) {
            if (pollOptions[_pollId][i].voteCount > maxVotes) {
                maxVotes = pollOptions[_pollId][i].voteCount;
                winningOption = i;
            }
        }
        
        polls[_pollId].winningOption = winningOption;
        
        emit PollFinalized(_pollId, winningOption);
    }
    
    /**
     * @dev Retorna informações da votação
     * @param _pollId ID da votação
     */
    function getPollInfo(uint256 _pollId) 
        external 
        view 
        pollExists(_pollId) 
        returns (
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            bool isFinalized,
            address creator,
            uint256 totalVotes,
            uint256 winningOption
        ) 
    {
        Poll memory poll = polls[_pollId];
        return (
            poll.title,
            poll.description,
            poll.startTime,
            poll.endTime,
            poll.isActive,
            poll.isFinalized,
            poll.creator,
            poll.totalVotes,
            poll.winningOption
        );
    }
    
    /**
     * @dev Retorna informações de uma opção específica
     * @param _pollId ID da votação
     * @param _optionIndex Índice da opção
     */
    function getOptionInfo(uint256 _pollId, uint256 _optionIndex) 
        external 
        view 
        pollExists(_pollId) 
        returns (string memory name, uint256 voteCount, bool exists) 
    {
        Option memory option = pollOptions[_pollId][_optionIndex];
        return (option.name, option.voteCount, option.exists);
    }
    
    /**
     * @dev Retorna o resultado final da votação
     * @param _pollId ID da votação
     */
    function getFinalResult(uint256 _pollId) 
        external 
        view 
        pollExists(_pollId) 
        returns (string memory winningOptionName, uint256 winningVotes) 
    {
        require(polls[_pollId].isFinalized, "Votacao ainda nao foi finalizada");
        
        uint256 winningIndex = polls[_pollId].winningOption;
        Option memory winningOption = pollOptions[_pollId][winningIndex];
        
        return (winningOption.name, winningOption.voteCount);
    }
    
    /**
     * @dev Verifica se um endereço já votou em uma votação específica
     * @param _pollId ID da votação
     * @param _voter Endereço do votante
     */
    function checkIfVoted(uint256 _pollId, address _voter) 
        external 
        view 
        pollExists(_pollId) 
        returns (bool) 
    {
        return hasVoted[_pollId][_voter];
    }
    
    /**
     * @dev Retorna o número total de votações criadas
     */
    function getTotalPolls() external view returns (uint256) {
        return pollCount;
    }
}
