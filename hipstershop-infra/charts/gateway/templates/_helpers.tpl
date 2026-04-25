{{- define "gateway.labels" -}}
app.kubernetes.io/name: {{ .Values.name | default "fanvault-gateway" }}
app.kubernetes.io/component: gateway
app.kubernetes.io/part-of: fanvault
app.kubernetes.io/managed-by: Helm
role: dev-gateway
{{- end }}
