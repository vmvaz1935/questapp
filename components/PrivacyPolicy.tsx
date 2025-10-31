import React from 'react';

const PrivacyPolicy: React.FC<{ onAccept?: () => void }> = ({ onAccept }) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Política de Privacidade e Proteção de Dados (LGPD)
        </h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              1. Informações Gerais
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Esta aplicação está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              Todos os dados pessoais e de saúde coletados são tratados com máxima segurança e confidencialidade,
              respeitando os princípios da LGPD: finalidade, adequação, necessidade, transparência, segurança,
              prevenção, não discriminação e responsabilização e prestação de contas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              2. Dados Coletados
            </h2>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                2.1 Dados de Profissionais de Saúde
              </h3>
              <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Nome completo</li>
                <li>E-mail profissional</li>
                <li>Senha (armazenada com hash criptográfico)</li>
                <li>Identificador único do profissional</li>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                2.2 Dados de Pacientes
              </h3>
              <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Nome completo</li>
                <li>Idade</li>
                <li>Sexo</li>
                <li>Diagnóstico</li>
                <li>Lado acometido (quando aplicável)</li>
                <li>Dados de fisioterapeuta e médico responsáveis</li>
                <li>Respostas a questionários clínicos</li>
                <li>Pontuações e resultados de avaliações</li>
                <li>Histórico de avaliações realizadas</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              3. Finalidade do Tratamento
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Os dados coletados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Cadastro e autenticação de profissionais de saúde</li>
              <li>Gerenciamento de pacientes e seus dados clínicos</li>
              <li>Aplicação de questionários clínicos validados</li>
              <li>Geração de relatórios e análises de evolução</li>
              <li>Comparação de resultados entre diferentes avaliações</li>
              <li>Melhoria contínua do sistema</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              4. Segurança e Confidencialidade
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Implementamos medidas técnicas e administrativas para garantir a segurança dos dados:
            </p>
            <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Armazenamento local:</strong> Dados armazenados apenas no navegador do usuário (localStorage), sem transmissão para servidores externos</li>
              <li><strong>Criptografia de senhas:</strong> Senhas armazenadas com hash SHA-256, nunca em texto plano</li>
              <li><strong>Isolamento de dados:</strong> Cada profissional acessa apenas seus próprios dados e pacientes</li>
              <li><strong>Autenticação:</strong> Acesso protegido por login e senha</li>
              <li><strong>Confidencialidade:</strong> Dados de pacientes são de acesso exclusivo do profissional responsável</li>
              <li><strong>Integridade:</strong> Validações para prevenir acesso não autorizado ou alteração indevida</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              5. Compartilhamento de Dados
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              <strong>Nenhum dado é compartilhado, vendido ou divulgado a terceiros.</strong> Os dados permanecem
              armazenados localmente no navegador do profissional e não são transmitidos para servidores externos,
              garantindo total privacidade e controle sobre as informações.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              6. Direitos do Titular (LGPD)
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              De acordo com a LGPD, você tem direito a:
            </p>
            <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Confirmação da existência de tratamento:</strong> Saber se seus dados são tratados</li>
              <li><strong>Acesso aos dados:</strong> Visualizar todos os seus dados pessoais</li>
              <li><strong>Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização, bloqueio ou eliminação:</strong> Solicitar remoção de dados desnecessários ou excessivos</li>
              <li><strong>Portabilidade:</strong> Solicitar transferência dos dados para outro sistema</li>
              <li><strong>Revogação do consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
              <li><strong>Informação sobre compartilhamento:</strong> Saber com quem os dados são compartilhados</li>
              <li><strong>Informação sobre recusa:</strong> Saber sobre a possibilidade de não fornecer consentimento</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              7. Retenção de Dados
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Os dados são armazenados localmente no navegador e permanecem disponíveis enquanto o profissional
              mantiver sua conta ativa ou até que seja solicitada a exclusão. Você pode excluir seus dados a
              qualquer momento através da exclusão do localStorage do navegador ou através das opções de exclusão
              disponíveis na aplicação.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              8. Contato e Responsável pelo Tratamento
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados, entre em contato através
              do profissional responsável pela aplicação ou gestor do sistema.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              9. Consentimento
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Ao utilizar esta aplicação, você concorda com o tratamento de seus dados pessoais e dos dados de seus
              pacientes conforme descrito nesta política, em conformidade com a LGPD. O consentimento é livre,
              informado e pode ser revogado a qualquer momento.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              10. Alterações na Política
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Esta política pode ser atualizada periodicamente. Alterações significativas serão comunicadas aos
              usuários através da aplicação. Recomendamos a leitura periódica desta política.
            </p>
          </section>

          <section className="mb-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              ⚠️ Importante
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Esta aplicação armazena dados sensíveis de saúde. É responsabilidade do profissional:
            </p>
            <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Manter o navegador e dispositivo seguros</li>
              <li>Não compartilhar credenciais de acesso</li>
              <li>Fazer backup regular dos dados importantes</li>
              <li>Limpar dados ao utilizar computadores compartilhados</li>
              <li>Obter consentimento dos pacientes para registro de dados</li>
            </ul>
          </section>

          {onAccept && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={onAccept}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Aceitar e Continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

