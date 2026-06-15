// =============================
// CONECTA DIGITAL - SISTEMA COMPLETO
// =============================

// ----- BANCO DE DADOS LOCAL -----
let participantes = JSON.parse(localStorage.getItem("participantes")) || [];
let diagnosticos = JSON.parse(localStorage.getItem("diagnosticos")) || {};
let trilhas = JSON.parse(localStorage.getItem("trilhas")) || {};
let avaliacoes = JSON.parse(localStorage.getItem("avaliacoes")) || {};

function salvarDados() {
    localStorage.setItem("participantes", JSON.stringify(participantes));
    localStorage.setItem("diagnosticos", JSON.stringify(diagnosticos));
    localStorage.setItem("trilhas", JSON.stringify(trilhas));
    localStorage.setItem("avaliacoes", JSON.stringify(avaliacoes));
}

// Áreas de competência (usadas no diagnóstico e avaliação final)
const areas = [
    "Uso de aplicativos no celular",
    "Navegação na internet",
    "Uso de e-mail",
    "Criação de senhas fortes",
    "Segurança digital",
    "Identificação de golpes",
    "Uso de aplicativos bancários",
    "Acesso a serviços públicos digitais",
    "Pesquisa de informações confiáveis"
];

// Mapeamento de módulos (conteúdo + vídeo)
const modulosBase = {
    "Segurança digital": { titulo: "Segurança na Internet", conteudo: "Aprenda a proteger seus dados, usar autenticação em dois fatores e evitar riscos.", video: "https://www.youtube.com/embed/HzJte6YrVws" },
    "Identificação de golpes": { titulo: "Como identificar golpes digitais", conteudo: "Phishing, SMS falsos, e-mails fraudulentos: saiba reconhecer.", video: "https://www.youtube.com/embed/4wGq9C0qjZ0" },
    "Criação de senhas fortes": { titulo: "Criação de senhas fortes", conteudo: "Use combinações seguras, gerenciadores de senhas e evite repetições.", video: "" },
    "Uso de aplicativos bancários": { titulo: "Segurança em apps bancários", conteudo: "Autenticação em dois fatores, cuidado com redes públicas, transações seguras.", video: "" },
    "Acesso a serviços públicos digitais": { titulo: "Uso de serviços públicos online (Gov.br)", conteudo: "Como acessar, criar conta, emitir documentos e usar o aplicativo Meu Gov.br.", video: "https://www.youtube.com/embed/OVVw6S1R0u4" },
    "Uso de e-mail": { titulo: "Uso correto do e-mail", conteudo: "Enviar, anexos, etiqueta, evitar spam e phishing.", video: "" },
    "Navegação na internet": { titulo: "Navegação segura e eficiente", conteudo: "Sites confiáveis, histórico, favoritos, privacidade.", video: "" },
    "Uso de aplicativos no celular": { titulo: "Introdução a aplicativos", conteudo: "Instalação, permissões, armazenamento, atualizações.", video: "" }
};

// ----- FUNÇÕES DE AUTENTICAÇÃO -----
if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const user = document.getElementById("loginUser").value.trim();
        const pass = document.getElementById("loginPassword").value;
        if (user === "admin" && pass === "123456") {
            sessionStorage.setItem("conecta_user", JSON.stringify({ tipo: "admin", id: "admin" }));
            window.location.href = "relatorios.html";
            return;
        }
        const participante = participantes.find(p => (p.email === user || p.cpf === user) && p.senha === pass);
        if (participante) {
            sessionStorage.setItem("conecta_user", JSON.stringify({ tipo: "participante", id: participante.id }));
            window.location.href = "diagnostico.html";
        } else {
            document.getElementById("loginError").style.display = "block";
        }
    });
}

// ----- CADASTRO -----
if (document.getElementById("cadastroForm")) {
    // Calcular idade automaticamente
    document.getElementById("dataNasc").addEventListener("change", function() {
        const nasc = new Date(this.value);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const mes = hoje.getMonth() - nasc.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
        document.getElementById("idade").value = isNaN(idade) ? "" : idade;
    });

    document.getElementById("cadastroForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const cpf = document.getElementById("cpf").value.replace(/\D/g, "");
        if (cpf.length !== 11) { alert("CPF inválido (11 dígitos)."); return; }
        const email = document.getElementById("email").value;
        if (participantes.some(p => p.cpf === cpf || p.email === email)) {
            alert("CPF ou E-mail já cadastrado!");
            return;
        }
        const novoId = Date.now().toString();
        const novoParticipante = {
            id: novoId,
            nome: document.getElementById("nome").value,
            dataNasc: document.getElementById("dataNasc").value,
            idade: parseInt(document.getElementById("idade").value),
            genero: document.getElementById("genero").value,
            escolaridade: document.getElementById("escolaridade").value,
            profissao: document.getElementById("profissao").value,
            bairro: document.getElementById("bairro").value,
            telefone: document.getElementById("telefone").value,
            email: email,
            cpf: cpf,
            senha: document.getElementById("senha").value,
            perfilTecnologico: {
                temComputador: document.getElementById("temComputador").value,
                temSmartphone: document.getElementById("temSmartphone").value,
                temInternet: document.getElementById("temInternet").value,
                frequenciaUso: document.getElementById("frequenciaUso").value
            },
            dataCadastro: new Date().toISOString()
        };
        participantes.push(novoParticipante);
        salvarDados();
        alert("Cadastro realizado! Agora faça login com seu CPF ou e-mail.");
        window.location.href = "index.html";
    });
}

// ----- DIAGNÓSTICO (gerar questões e salvar) -----
if (document.getElementById("diagnosticoForm")) {
    // Verificar login participante
    const userSession = JSON.parse(sessionStorage.getItem("conecta_user"));
    if (!userSession || userSession.tipo !== "participante") {
        alert("Você precisa estar logado como participante para acessar esta página.");
        window.location.href = "index.html";
    }
    const participanteId = userSession.id;
    const participanteAtual = participantes.find(p => p.id === participanteId);

    // Gerar dinamicamente as questões
    const container = document.getElementById("questoesArea");
    areas.forEach((area, idx) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <label>${area}:</label>
            <select id="diag_${idx}">
                <option value="0">0 - Não sei utilizar</option>
                <option value="1">1 - Muita dificuldade</option>
                <option value="2">2 - Dificuldade</option>
                <option value="3">3 - Consigo com ajuda</option>
                <option value="4">4 - Consigo sozinho</option>
                <option value="5">5 - Domínio completo</option>
            </select>
        `;
        container.appendChild(div);
    });

    document.getElementById("diagnosticoForm").addEventListener("submit", function(e) {
        e.preventDefault();
        let respostas = [];
        for (let i = 0; i < areas.length; i++) {
            respostas.push(parseInt(document.getElementById(`diag_${i}`).value));
        }
        const media = respostas.reduce((a,b) => a+b, 0) / areas.length;
        let nivel = "";
        if (media <= 1.5) nivel = "Alto risco de exclusão digital";
        else if (media <= 2.5) nivel = "Necessita de acompanhamento";
        else if (media <= 3.5) nivel = "Possui autonomia básica";
        else nivel = "Possui autonomia avançada";

        diagnosticos[participanteId] = { respostas, media, nivel, data: new Date().toISOString() };
        salvarDados();

        // Gerar trilha personalizada
        let modulosGerados = [];
        areas.forEach((area, idx) => {
            if (respostas[idx] < 3) {
                let chave = area;
                if (area.includes("Criação")) chave = "Criação de senhas fortes";
                if (area.includes("Identificação")) chave = "Identificação de golpes";
                if (area.includes("Segurança")) chave = "Segurança digital";
                if (area.includes("bancários")) chave = "Uso de aplicativos bancários";
                if (area.includes("serviços públicos")) chave = "Acesso a serviços públicos digitais";
                if (area.includes("e-mail")) chave = "Uso de e-mail";
                if (area.includes("Navegação")) chave = "Navegação na internet";
                if (area.includes("aplicativos no celular")) chave = "Uso de aplicativos no celular";
                if (modulosBase[chave]) modulosGerados.push(modulosBase[chave]);
            }
        });
        if (modulosGerados.length === 0) {
            modulosGerados = [{ titulo: "Revisão de boas práticas", conteudo: "Parabéns! Você já possui boa autonomia. Reforce seus conhecimentos.", video: "" }];
        }
        trilhas[participanteId] = { modulos: modulosGerados, progresso: [], concluido: false };
        salvarDados();

        document.getElementById("resultadoDiagnostico").innerHTML = `
            <div class="sucesso">
                <strong>Diagnóstico salvo!</strong><br>
                Nível: ${nivel}<br>
                Média: ${media.toFixed(1)} (0 a 5)<br>
                Sua trilha personalizada foi gerada. <a href="cursos.html">Clique aqui para acessá-la</a>.
            </div>
        `;
    });
}

// ----- TRILHA (cursos.html) -----
if (document.getElementById("trilhaContainer")) {
    const userSession = JSON.parse(sessionStorage.getItem("conecta_user"));
    if (!userSession || userSession.tipo !== "participante") {
        window.location.href = "index.html";
    }
    const pid = userSession.id;
    const trilhaData = trilhas[pid];

    function carregarTrilha() {
        const container = document.getElementById("trilhaContainer");
        if (!trilhaData || !trilhaData.modulos) {
            container.innerHTML = "<p>Você ainda não realizou o diagnóstico. <a href='diagnostico.html'>Clique aqui para fazer o diagnóstico</a>.</p>";
            return;
        }
        const concluidos = trilhaData.progresso.length;
        const total = trilhaData.modulos.length;
        const percent = (concluidos / total) * 100;
        let html = `<div class="progress-bar"><div style="width: ${percent}%;"></div></div>`;
        html += `<p>Progresso: ${concluidos} de ${total} módulos concluídos (${Math.round(percent)}%)</p>`;
        trilhaData.modulos.forEach((mod, idx) => {
            const feito = trilhaData.progresso.includes(idx);
            html += `
                <div class="modulo-card">
                    <h3>${mod.titulo} ${feito ? "✅" : ""}</h3>
                    <p>${mod.conteudo}</p>
                    ${mod.video ? `<iframe width="100%" height="200" src="${mod.video}" frameborder="0" allowfullscreen></iframe>` : ""}
                    ${!feito ? `<button onclick="concluirModulo(${idx})" style="margin-top:10px;">Concluir Módulo</button>` : "<span style='color:green;'>Módulo concluído!</span>"}
                </div>
            `;
        });
        container.innerHTML = html;
        if (percent === 100 && !trilhaData.concluido) {
            trilhaData.concluido = true;
            salvarDados();
            alert("Parabéns! Você concluiu toda a trilha. Agora realize a avaliação final.");
        }
    }

    window.concluirModulo = function(idx) {
        if (!trilhaData.progresso.includes(idx)) {
            trilhaData.progresso.push(idx);
            salvarDados();
            carregarTrilha();
        }
    };

    document.getElementById("btnIrParaAvaliacao").addEventListener("click", () => {
        window.location.href = "certificado.html"; // a avaliação final foi colocada na página de certificado para fluxo contínuo
    });

    carregarTrilha();
}

// ----- AVALIAÇÃO FINAL E CERTIFICADO (certificado.html) -----
// ----- AVALIAÇÃO FINAL E CERTIFICADO (certificado.html) -----
if (document.getElementById("certificadoArea")) {
    const userSession = JSON.parse(sessionStorage.getItem("conecta_user"));
    if (!userSession || userSession.tipo !== "participante") {
        window.location.href = "index.html";
    }
    const pid = userSession.id;
    const participante = participantes.find(p => p.id === pid);
    const diagnostico = diagnosticos[pid];
    const trilhaData = trilhas[pid];

    if (!diagnostico) {
        document.getElementById("certificadoArea").innerHTML = "<p>Você precisa realizar o diagnóstico primeiro. <a href='diagnostico.html'>Ir para diagnóstico</a></p>";
    } else if (!trilhaData || !trilhaData.concluido) {
        document.getElementById("certificadoArea").innerHTML = "<p>Você precisa concluir 100% da sua trilha de aprendizagem. <a href='cursos.html'>Voltar para trilha</a></p>";
    } else {
        // Exibir formulário de avaliação final
        let htmlForm = `<h3>Avaliação Final (pós-trilha)</h3><p>Responda novamente as questões para medir sua evolução:</p><form id="avFinalForm">`;
        areas.forEach((area, idx) => {
            htmlForm += `<label>${area}:</label><select id="aval_${idx}">`;
            for (let i = 0; i <= 5; i++) {
                htmlForm += `<option value="${i}">${i} - ${["Não sei","Muita dificuldade","Dificuldade","Com ajuda","Sozinho","Domínio"][i]}</option>`;
            }
            htmlForm += `</select>`;
        });
        htmlForm += `<button type="submit">Finalizar Avaliação e Gerar Certificado</button></form>`;
        document.getElementById("certificadoArea").innerHTML = htmlForm;

        document.getElementById("avFinalForm").addEventListener("submit", function(e) {
            e.preventDefault();
            let respostasFinais = [];
            for (let i = 0; i < areas.length; i++) {
                respostasFinais.push(parseInt(document.getElementById(`aval_${i}`).value));
            }
            const mediaFinal = respostasFinais.reduce((a,b)=>a+b,0) / areas.length;
            const nivelFinal = mediaFinal > 3.5 ? "Autonomia avançada" : "Autonomia básica";
            avaliacoes[pid] = { respostas: respostasFinais, media: mediaFinal, nivel: nivelFinal, data: new Date().toISOString() };
            salvarDados();

            const mediaInicial = diagnostico.media;
            const evolPercent = ((mediaFinal - mediaInicial) / 5) * 100;
            const cargaHoraria = trilhaData.modulos.length * 2;
            const codigoUnico = btoa(pid + Date.now()).substr(0, 12);
            const modulosNomes = trilhaData.modulos.map(m => m.titulo).join(", ");

            let certHTML = `
                <div id="certificadoWrapper" class="certificado" style="margin-top:20px; background: white; padding: 20px;">
                    <h2>CERTIFICADO DE CONCLUSÃO</h2>
                    <p>O programa <strong>Conecta Digital – Portal de Inclusão Tecnológica</strong> certifica que:</p>
                    <h1>${participante.nome}</h1>
                    <p><strong>CPF:</strong> ${participante.cpf}</p>
                    <p>Concluiu com êxito a capacitação em inclusão digital, participando das atividades de aprendizagem relacionadas a:</p>
                    <p><strong>${modulosNomes}</strong></p>
                    <p><strong>Carga horária:</strong> ${cargaHoraria} horas</p>
                    <p><strong>Data de emissão:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
                    <p><strong>Código único:</strong> ${codigoUnico}</p>
                    <div id="qrcode" style="display:flex; justify-content:center; margin:20px 0;"></div>
                    <p>_________________________________<br>Responsável pelo Projeto Conecta Digital</p>
                    <p><em>Evolução alcançada: ${evolPercent > 0 ? "+" : ""}${evolPercent.toFixed(1)}% de melhoria nas competências digitais.</em></p>
                </div>
            `;
            document.getElementById("certificadoArea").innerHTML = certHTML;
            
            // Gerar QR Code
            new QRCode(document.getElementById("qrcode"), { text: codigoUnico, width: 120, height: 120 });
            
            // Mostrar botão de PDF e garantir que o QR Code seja renderizado antes de capturar
            const btnPDF = document.getElementById("btnImprimirCert");
            btnPDF.style.display = "block";
            
            // Pequeno delay para o QR Code aparecer
            setTimeout(() => {
                btnPDF.addEventListener("click", function() {
                    const element = document.getElementById("certificadoWrapper");
                    if (!element) {
                        alert("Erro: elemento do certificado não encontrado.");
                        return;
                    }
                    // Usar html2pdf com configurações para melhor renderização
                    html2pdf().from(element).set({
                        margin: 0.5,
                        filename: `certificado_${participante.cpf}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, letterRendering: true },
                        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                    }).save();
                });
            }, 500); // aguarda o QR Code ser desenhado
        });
    }
}
// ----- ADMIN / RELATÓRIOS (relatorios.html) -----
if (document.getElementById("statsGrid")) {
    const userSession = JSON.parse(sessionStorage.getItem("conecta_user"));
    if (!userSession || userSession.tipo !== "admin") {
        alert("Acesso restrito a administradores.");
        window.location.href = "index.html";
    }

    function atualizarDashboard() {
        const total = participantes.length;
        const idades = participantes.map(p => p.idade).filter(i => i);
        const mediaIdade = idades.length ? (idades.reduce((a,b)=>a+b,0)/idades.length).toFixed(0) : 0;
        const escolaridades = participantes.map(p => p.escolaridade);
        const escolaridadePred = moda(escolaridades);
        const semInternet = participantes.filter(p => p.perfilTecnologico?.temInternet === "Não").length;
        let mediasIni = participantes.map(p => diagnosticos[p.id]?.media || 0).filter(m => m > 0);
        let mediaInicial = mediasIni.length ? (mediasIni.reduce((a,b)=>a+b,0)/mediasIni.length) : 0;
        let mediasFim = participantes.map(p => avaliacoes[p.id]?.media || 0).filter(m => m > 0);
        let mediaFinal = mediasFim.length ? (mediasFim.reduce((a,b)=>a+b,0)/mediasFim.length) : 0;
        let evolMedia = mediaFinal - mediaInicial;

        document.getElementById("statsGrid").innerHTML = `
            <div class="card" style="flex:1;">Total participantes: ${total}</div>
            <div class="card" style="flex:1;">Faixa etária média: ${mediaIdade} anos</div>
            <div class="card" style="flex:1;">Escolaridade predominante: ${escolaridadePred}</div>
            <div class="card" style="flex:1;">Sem internet: ${semInternet} (${((semInternet/total)*100).toFixed(0)}%)</div>
            <div class="card" style="flex:1;">Conhecimento inicial: ${(mediaInicial*20).toFixed(0)}%</div>
            <div class="card" style="flex:1;">Conhecimento final: ${(mediaFinal*20).toFixed(0)}%</div>
            <div class="card" style="flex:1;">Evolução média: +${(evolMedia*20).toFixed(1)}%</div>
        `;

        // Gráfico faixa etária
        const faixas = {'0-17':0,'18-30':0,'31-50':0,'51+':0};
        participantes.forEach(p => {
            if (p.idade < 18) faixas['0-17']++;
            else if (p.idade <= 30) faixas['18-30']++;
            else if (p.idade <= 50) faixas['31-50']++;
            else faixas['51+']++;
        });
        new Chart(document.getElementById("faixaEtariaChart"), { type: 'bar', data: { labels: Object.keys(faixas), datasets: [{ label: 'Participantes', data: Object.values(faixas), backgroundColor: '#0d6efd' }] } });

        // Dificuldades
        let dificuldades = [0,0,0,0,0,0,0,0,0];
        participantes.forEach(p => {
            const diag = diagnosticos[p.id];
            if (diag) {
                diag.respostas.forEach((nota, idx) => { if (nota < 3) dificuldades[idx]++; });
            }
        });
        new Chart(document.getElementById("dificuldadesChart"), { type: 'pie', data: { labels: areas, datasets: [{ data: dificuldades, backgroundColor: '#ffc107' }] } });

        // Evolução individual
        const evolData = participantes.filter(p => diagnosticos[p.id] && avaliacoes[p.id]).map(p => ({ antes: diagnosticos[p.id].media, depois: avaliacoes[p.id].media }));
        if (evolData.length) {
            new Chart(document.getElementById("evolucaoChart"), { type: 'line', data: { labels: evolData.map((_,i)=>`P${i+1}`), datasets: [{ label: 'Antes (%)', data: evolData.map(e=>e.antes*20), borderColor: '#dc3545' }, { label: 'Depois (%)', data: evolData.map(e=>e.depois*20), borderColor: '#28a745' }] } });
        }
    }

    function moda(arr) {
        const freq = {};
        arr.forEach(v => freq[v] = (freq[v] || 0) + 1);
        return Object.keys(freq).reduce((a,b) => freq[a] > freq[b] ? a : b);
    }

    function carregarTabelaParticipantes(filtro = "") {
        let html = "";
        participantes.forEach(p => {
            if (p.nome.toLowerCase().includes(filtro.toLowerCase()) || p.cpf.includes(filtro) || p.email.toLowerCase().includes(filtro.toLowerCase())) {
                const diag = diagnosticos[p.id] ? (diagnosticos[p.id].media * 20).toFixed(0) + "%" : "Pendente";
                const aval = avaliacoes[p.id] ? (avaliacoes[p.id].media * 20).toFixed(0) + "%" : "Pendente";
                html += `<tr><td>${p.id.slice(-4)}</td><td>${p.nome}</td><td>${p.cpf}</td><td>${p.email}</td><td>${diag}</td><td>${aval}</td></tr>`;
            }
        });
        document.getElementById("tabelaParticipantes").innerHTML = html;
    }

    document.getElementById("searchParticipante").addEventListener("input", function() {
        carregarTabelaParticipantes(this.value);
    });

    document.getElementById("gerarRelatorioPDF").addEventListener("click", () => {
        let relatorioHTML = gerarRelatorioTexto();
        const win = window.open();
        win.document.write(`<html><head><title>Relatorio_Impacto_ConectaDigital</title><link rel="stylesheet" href="style.css"></head><body>${relatorioHTML}</body></html>`);
        win.print();
    });

    function gerarRelatorioTexto() {
        const total = participantes.length;
        let dificuldadesMap = {};
        participantes.forEach(p => {
            const diag = diagnosticos[p.id];
            if (diag) {
                diag.respostas.forEach((nota, idx) => {
                    if (nota < 3) dificuldadesMap[areas[idx]] = (dificuldadesMap[areas[idx]] || 0) + 1;
                });
            }
        });
        let evolMedia = participantes.filter(p => diagnosticos[p.id] && avaliacoes[p.id]).map(p => (avaliacoes[p.id].media - diagnosticos[p.id].media) * 20).reduce((a,b)=>a+b,0) / (participantes.filter(p => diagnosticos[p.id] && avaliacoes[p.id]).length || 1);
        return `<div class="container"><div class="card"><h2>Relatório de Impacto Social - Conecta Digital</h2><p>Participantes atendidos: ${total}</p><h3>Principais dificuldades identificadas:</h3><ul>${Object.entries(dificuldadesMap).map(([k,v])=>`<li>${k}: ${((v/total)*100).toFixed(0)}%</li>`).join('')}</ul><h3>Resultado da ação:</h3><p>A comunidade apresentou aumento médio de ${evolMedia.toFixed(1)}% no nível de autonomia digital.</p><footer>Emissão: ${new Date().toLocaleString()}</footer></div></div>`;
    }

    atualizarDashboard();
    carregarTabelaParticipantes();
}
