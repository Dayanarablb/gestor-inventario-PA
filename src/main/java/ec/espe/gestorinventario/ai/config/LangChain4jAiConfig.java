package ec.espe.gestorinventario.ai.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.service.AiServices;
import ec.espe.gestorinventario.ai.service.HrAssistantService;
import ec.espe.gestorinventario.ai.service.HrClasificadorService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LangChain4jAiConfig {

    @Bean
    public HrAssistantService hrAssistantService(ChatModel chatModel) {
        return AiServices.builder(HrAssistantService.class)
                .chatModel(chatModel)
                .build();
    }

    @Bean
    public HrClasificadorService hrClasificadorService(ChatModel chatModel) {
        return AiServices.builder(HrClasificadorService.class)
                .chatModel(chatModel)
                .build();
    }
}
