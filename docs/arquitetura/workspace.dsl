/*
 * C4 níveis 1, 2 e 3 do back-end da oficina.
 * Abrir em https://structurizr.com/dsl ou com structurizr-lite e exportar para docs/arquitetura/c4.pdf.
 * Cenário do nível 3: aprovação do orçamento com reserva de peças.
 */
workspace "Oficina SOAT" "Tech Challenge Fase 1, FIAP SOAT" {

    model {
        cliente = person "Cliente" "Dono do veículo. Consulta a OS e aprova ou rejeita o orçamento."
        atendente = person "Atendente" "Cadastra cliente e veículo, abre a OS, publica orçamento, entrega."
        tecnico = person "Técnico" "Faz diagnóstico, inclui serviços e peças, executa."
        admin = person "Administrador" "Mantém catálogo, estoque e usuários."

        oficina = softwareSystem "Sistema da Oficina" "Gestão de ordens de serviço, orçamento e estoque." {

            portal = container "Portal do projeto" "Documentação pública do projeto." "HTML, CSS, JS estático na Vercel"

            api = container "Oficina API" "Monólito em camadas com DDD. Expõe REST /api/v1 e Swagger." "TypeScript, Node.js 24, Fastify 5" {
                rotas = component "Rotas HTTP" "Valida schema, lê JWT, traduz erros em 4xx e 5xx." "interfaces/http"
                authPlugin = component "Plugin de autenticação" "Verifica assinatura, issuer, audience, validade e perfil." "@fastify/jwt"
                decidir = component "Caso de uso DecidirOrcamento" "Abre transação, confere dono e versão, aplica idempotência." "application"
                osAgg = component "Agregado OrdemServico" "Status, versão e transições permitidas." "domain/atendimento"
                orcAgg = component "Agregado Orcamento" "Versão, preços congelados, decisão." "domain/atendimento"
                reservar = component "Serviço ReservarPecas" "Reserva todas as peças ou nenhuma." "domain/estoque"
                pecaAgg = component "Agregado Peca" "Saldo físico, reservado, movimentos." "domain/estoque"
                repos = component "Repositórios PostgreSQL" "SQL com SELECT FOR UPDATE em ordem de UUID." "infrastructure/repositories"
                uow = component "Unidade de trabalho" "Uma transação por caso de uso." "infrastructure/db"
            }

            db = container "Banco de dados" "OS, orçamento, estoque, histórico, usuários." "PostgreSQL 16 (Compose local, Supabase em produção)" "Database"
        }

        github = softwareSystem "GitHub Actions" "CI: lint, testes, cobertura, SonarCloud, Trivy." "Externo"

        cliente -> api "Consulta OS e decide orçamento" "HTTPS JSON + JWT"
        atendente -> api "Cadastros, OS, entrega" "HTTPS JSON + JWT"
        tecnico -> api "Diagnóstico e execução" "HTTPS JSON + JWT"
        admin -> api "Catálogo, estoque, indicador" "HTTPS JSON + JWT"
        cliente -> portal "Lê a documentação"
        api -> db "Lê e grava" "SQL, pool via pooler em modo transação"
        github -> api "Testa e analisa a cada PR"

        cliente -> rotas "POST /quotes/{id}/decision" "HTTPS"
        rotas -> authPlugin "Valida token e perfil CLIENTE"
        rotas -> decidir "Executa"
        decidir -> uow "Abre e fecha transação"
        decidir -> osAgg "Confere status e versão"
        decidir -> orcAgg "Registra decisão"
        decidir -> reservar "Se aprovado, reserva"
        reservar -> pecaAgg "Reserva quantidade"
        decidir -> repos "Carrega e salva agregados"
        repos -> db "SELECT FOR UPDATE, UPDATE, INSERT"
    }

    views {
        systemContext oficina "N1_Contexto" {
            include *
            autolayout lr
        }
        container oficina "N2_Conteineres" {
            include *
            autolayout lr
        }
        component api "N3_Componentes_Aprovacao" {
            include *
            autolayout lr
        }
        styles {
            element "Person" {
                shape Person
                background #b4441f
                color #ffffff
            }
            element "Database" {
                shape Cylinder
            }
            element "Externo" {
                background #999999
                color #ffffff
            }
        }
    }
}
