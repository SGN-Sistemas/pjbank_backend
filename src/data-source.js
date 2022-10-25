export const AppDataSource = new DataSource({
    type: "postgres",
    host: "192.168.102.195",
    port: 1433,
    username: "sa",
    password: "sgn123",
    database: "TESTE_ROBERTA",
    synchronize: true,
    logging: true,
    entities: [clientes, agendamentos],
    subscribers: [],
    migrations: [],
})