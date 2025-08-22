package com.airline.flightreservations.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Gson types
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;

import java.io.IOException;

@Configuration
public class JacksonGsonBridgeConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer gsonBridge() {
        return builder -> {
            SimpleModule module = new SimpleModule();

            // One serializer that works for any Gson JSON node
            JsonSerializer<JsonElement> serializer = new JsonSerializer<JsonElement>() {
                @Override
                public void serialize(JsonElement value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
                    // Reuse Jackson's own parser to convert the Gson tree to a Jackson tree
                    ObjectMapper mapper = (ObjectMapper) gen.getCodec();
                    JsonNode node = mapper.readTree(value.toString());
                    gen.writeTree(node);
                }
            };

            module.addSerializer(JsonElement.class, serializer);
            module.addSerializer(JsonObject.class, serializer);
            module.addSerializer(JsonArray.class, serializer);

            builder.modules(module);
        };
    }
}
