const mockOpenAI = jest.fn().mockImplementation(() => ({
  beta: {
    assistants: {
      retrieve: jest.fn(),
    },
    threads: {
      create: jest.fn(),
      retrieve: jest.fn(),
      messages: {
        create: jest.fn(),
        list: jest.fn(),
      },
      runs: {
        list: jest.fn(),
        retrieve: jest.fn(),
        createAndPoll: jest.fn(),
      },
    },
  },
}));

export default mockOpenAI;
