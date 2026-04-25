{{/*
  Full name: just use the service name directly (no chart prefix needed).
*/}}
{{- define "common.fullname" -}}
{{- .name }}
{{- end }}

{{/*
  Standard labels applied to all resources.
  Call with: include "common.labels" (dict "name" $name "root" $)
*/}}
{{- define "common.labels" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/part-of: {{ .root.Values.partOf | default "fanvault" }}
app.kubernetes.io/managed-by: Helm
helm.sh/chart: backend-common-1.0.0
{{- end }}

{{/*
  ConfigMap name for a given service.
*/}}
{{- define "common.configmapName" -}}
{{ .name }}-config
{{- end }}

{{/*
  Secret name for a given service.
*/}}
{{- define "common.secretName" -}}
{{ .name }}-secret
{{- end }}
