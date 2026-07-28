from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

# ---------------------------------------------------------
# 1. Configuração do Banco de Dados (SQL Server)
# Substitua 'NOME_DO_SERVIDOR', 'USUARIO' e 'SENHA' pelos seus dados.
# Se for autenticação do Windows (Trusted Connection), a string muda um pouco.
# ---------------------------------------------------------
# Exemplo com Autenticação do SQL Server:
# SQLALCHEMY_DATABASE_URL = "mssql+pyodbc://USUARIO:SENHA@NOME_DO_SERVIDOR/PortalInfra?driver=ODBC+Driver+17+for+SQL+Server"

# Exemplo com Autenticação do Windows (Trusted Connection):
SQLALCHEMY_DATABASE_URL = "mssql+pyodbc://HONCORD-6X5J2M2/PortalInfra?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ---------------------------------------------------------
# 2. Modelos do Banco de Dados (Refletindo seu SQL)
# ---------------------------------------------------------
class FabricanteDB(Base):
    __tablename__ = "Fabricantes"
    IdFabricante = Column(Integer, primary_key=True, index=True)
    NomeMarca = Column(String(50), nullable=False)
    
    # Relacionamento
    impressoras = relationship("ImpressoraDB", back_populates="fabricante")

class ImpressoraDB(Base):
    __tablename__ = "Impressoras"
    IdImpressora = Column(Integer, primary_key=True, index=True)
    Hostname = Column(String(100), nullable=False)
    EnderecoIP = Column(String(15), nullable=False)
    IdFabricante = Column(Integer, ForeignKey("Fabricantes.IdFabricante"))
    Modelo = Column(String(100))
    NumeroSerial = Column(String(100))
    StatusAtivo = Column(String(50), default='Na Rede')

    # Relacionamento
    fabricante = relationship("FabricanteDB", back_populates="impressoras")

# ---------------------------------------------------------
# 3. Schemas de Resposta (Como o Front-end vai receber)
# ---------------------------------------------------------
class ImpressoraResponse(BaseModel):
    ID: int
    Hostname: str
    IP: str
    Marca: str
    Modelo: str
    Serial: str
    Status: str

    class Config:
        orm_mode = True

# ---------------------------------------------------------
# 4. Inicialização da API
# ---------------------------------------------------------
app = FastAPI(title="Portal Infra - Monitoramento")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Depois ajustamos para a porta do seu front-end
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------
# 5. Rota Principal
# ---------------------------------------------------------
@app.get("/api/impressoras", response_model=list[ImpressoraResponse])
def listar_impressoras_com_marcas(db: Session = Depends(get_db)):
    """Retorna as impressoras com a marca já unida (JOIN), igual ao seu SELECT."""
    
    resultados = db.query(ImpressoraDB, FabricanteDB).join(
        FabricanteDB, ImpressoraDB.IdFabricante == FabricanteDB.IdFabricante
    ).all()
    
    lista_formatada = []
    for impressora, fabricante in resultados:
        lista_formatada.append({
            "ID": impressora.IdImpressora,
            "Hostname": impressora.Hostname,
            "IP": impressora.EnderecoIP,
            "Marca": fabricante.NomeMarca,
            "Modelo": impressora.Modelo,
            "Serial": impressora.NumeroSerial,
            "Status": impressora.StatusAtivo
        })
        
    return lista_formatada

# Adicione este schema de criação logo abaixo do "class ImpressoraResponse"
class ImpressoraCreate(BaseModel):
    Hostname: str
    IP: str
    Marca: str
    Modelo: str
    Serial: str
    Status: str

# Adicione esta nova rota no final do arquivo
@app.post("/api/impressoras", response_model=ImpressoraResponse)
def adicionar_impressora(impressora: ImpressoraCreate, db: Session = Depends(get_db)):
    """Recebe os dados do front, busca a FK da marca e salva no SQL Server."""
    
    # 1. Encontrar o IdFabricante pela string (Ex: "BROTHER" -> 1)
    fabricante = db.query(FabricanteDB).filter(FabricanteDB.NomeMarca == impressora.Marca).first()
    
    if not fabricante:
        raise HTTPException(status_code=400, detail="Fabricante não encontrado no banco.")

    # 2. Criar o objeto para inserção no banco
    nova_imp = ImpressoraDB(
        Hostname=impressora.Hostname,
        EnderecoIP=impressora.IP,
        IdFabricante=fabricante.IdFabricante,
        Modelo=impressora.Modelo,
        NumeroSerial=impressora.Serial,
        StatusAtivo=impressora.Status
    )
    
    # 3. Salvar no SQL Server
    db.add(nova_imp)
    db.commit()
    db.refresh(nova_imp) # Pega o IdImpressora gerado pelo banco

    # 4. Retornar os dados formatados para o Front-end
    return {
        "ID": nova_imp.IdImpressora,
        "Hostname": nova_imp.Hostname,
        "IP": nova_imp.EnderecoIP,
        "Marca": fabricante.NomeMarca,
        "Modelo": nova_imp.Modelo,
        "Serial": nova_imp.NumeroSerial,
        "Status": nova_imp.StatusAtivo
    }

# Adicione esta rota no final do seu main.py
@app.put("/api/impressoras/{impressora_id}", response_model=ImpressoraResponse)
def atualizar_impressora(impressora_id: int, impressora: ImpressoraCreate, db: Session = Depends(get_db)):
    """Recebe o ID na URL e os novos dados, atualizando o registro no SQL Server."""
    
    # 1. Verifica se a impressora existe no banco
    db_impressora = db.query(ImpressoraDB).filter(ImpressoraDB.IdImpressora == impressora_id).first()
    if not db_impressora:
        raise HTTPException(status_code=404, detail="Impressora não encontrada.")

    # 2. Encontra o novo IdFabricante (caso a marca tenha sido alterada)
    fabricante = db.query(FabricanteDB).filter(FabricanteDB.NomeMarca == impressora.Marca).first()
    if not fabricante:
        raise HTTPException(status_code=400, detail="Fabricante não encontrado no banco.")

    # 3. Atualiza os campos do objeto
    db_impressora.Hostname = impressora.Hostname
    db_impressora.EnderecoIP = impressora.IP
    db_impressora.IdFabricante = fabricante.IdFabricante
    db_impressora.Modelo = impressora.Modelo
    db_impressora.NumeroSerial = impressora.Serial
    db_impressora.StatusAtivo = impressora.Status

    # 4. Salva a edição no banco de dados e atualiza o objeto
    db.commit()
    db.refresh(db_impressora)

    return {
        "ID": db_impressora.IdImpressora,
        "Hostname": db_impressora.Hostname,
        "IP": db_impressora.EnderecoIP,
        "Marca": fabricante.NomeMarca,
        "Modelo": db_impressora.Modelo,
        "Serial": db_impressora.NumeroSerial,
        "Status": db_impressora.StatusAtivo
    }

# ---------------------------------------------------------
# MODELOS PARA SWITCHES/CONEXÕES
# ---------------------------------------------------------
class ConexaoDB(Base):
    __tablename__ = "ConexoesRede"
    IdConexao = Column(Integer, primary_key=True, index=True)
    NomeSwitch = Column(String(100), nullable=False)
    PortaSwitch = Column(Integer, nullable=False)
    DispositivoConectado = Column(String(150), nullable=False)
    PatchPanel = Column(Integer, nullable=True)
    PortaPatchPanel = Column(Integer, nullable=True)
    StatusPorta = Column(String(50), default='Ativo')

class ConexaoSchema(BaseModel):
    NomeSwitch: str
    PortaSwitch: int
    DispositivoConectado: str
    PatchPanel: int | None = None
    PortaPatchPanel: int | None = None
    StatusPorta: str

class ConexaoResponse(ConexaoSchema):
    IdConexao: int
    class Config:
        orm_mode = True

# ---------------------------------------------------------
# ROTAS PARA SWITCHES/CONEXÕES
# ---------------------------------------------------------
@app.get("/api/conexoes", response_model=list[ConexaoResponse])
def listar_conexoes(db: Session = Depends(get_db)):
    """Retorna todas as conexões mapeadas."""
    return db.query(ConexaoDB).all()

@app.post("/api/conexoes", response_model=ConexaoResponse)
def adicionar_conexao(conexao: ConexaoSchema, db: Session = Depends(get_db)):
    """Cadastra um novo mapeamento de rede."""
    nova_conexao = ConexaoDB(**conexao.dict())
    db.add(nova_conexao)
    db.commit()
    db.refresh(nova_conexao)
    return nova_conexao

@app.put("/api/conexoes/{conexao_id}", response_model=ConexaoResponse)
def atualizar_conexao(conexao_id: int, conexao: ConexaoSchema, db: Session = Depends(get_db)):
    """Atualiza um mapeamento existente."""
    db_conexao = db.query(ConexaoDB).filter(ConexaoDB.IdConexao == conexao_id).first()
    if not db_conexao:
        raise HTTPException(status_code=404, detail="Conexão não encontrada.")

    for var, value in vars(conexao).items():
        setattr(db_conexao, var, value) if value is not None else None

    db.commit()
    db.refresh(db_conexao)
    return db_conexao

@app.delete("/api/impressoras/{impressora_id}")
def deletar_impressora(impressora_id: int, db: Session = Depends(get_db)):
    """Busca a impressora pelo ID e a remove do banco de dados."""
    
    db_impressora = db.query(ImpressoraDB).filter(ImpressoraDB.IdImpressora == impressora_id).first()
    
    if not db_impressora:
        raise HTTPException(status_code=404, detail="Impressora não encontrada.")

    db.delete(db_impressora)
    db.commit()
    
    return {"mensagem": "Equipamento excluído com sucesso!"}